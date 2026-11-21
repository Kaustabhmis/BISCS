// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
// Algorithms after Piegl & Tiller, "The NURBS Book" (independent implementation).
#include "geometry/Nurbs.h"

#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

bool NurbsCurve::isValid(std::string* why) const {
    auto fail = [&](const char* m) { if (why) *why = m; return false; };
    if (degree < 1 || degree > 11) return fail("degree out of range");
    if (ctrl.size() < static_cast<std::size_t>(degree) + 1) return fail("too few control points");
    if (knots.size() != ctrl.size() + static_cast<std::size_t>(degree) + 1) return fail("knot count does not match");
    if (!weights.empty() && weights.size() != ctrl.size()) return fail("weight count does not match");
    for (std::size_t i = 1; i < knots.size(); ++i)
        if (!(knots[i] >= knots[i - 1]) || !std::isfinite(knots[i])) return fail("knots are not non-decreasing");
    for (const Vec2& p : ctrl)
        if (!p.isFinite()) return fail("invalid control point");
    for (double w : weights)
        if (!(w > 0.0) || !std::isfinite(w)) return fail("invalid weight");
    if (!(tMax() > tMin())) return fail("empty parameter range");
    return true;
}

Vec2 NurbsCurve::eval(double t) const {
    const int p = degree;
    const int n = static_cast<int>(ctrl.size());
    t = std::clamp(t, tMin(), tMax());
    // Knot span k with knots[k] <= t < knots[k+1], k in [p, n-1].
    int k = p;
    if (t >= tMax()) {
        k = n - 1;
        while (k > p && knots[static_cast<std::size_t>(k)] == knots[static_cast<std::size_t>(k + 1)]) --k;
    } else {
        int lo = p, hi = n;
        while (hi - lo > 1) {
            const int mid = (lo + hi) / 2;
            if (t >= knots[static_cast<std::size_t>(mid)]) lo = mid; else hi = mid;
        }
        k = lo;
    }
    // de Boor in homogeneous coordinates.
    struct H { double x, y, w; };
    std::vector<H> d(static_cast<std::size_t>(p) + 1);
    for (int j = 0; j <= p; ++j) {
        const std::size_t i = static_cast<std::size_t>(j + k - p);
        const double w = weights.empty() ? 1.0 : weights[i];
        d[static_cast<std::size_t>(j)] = {ctrl[i].x * w, ctrl[i].y * w, w};
    }
    for (int r = 1; r <= p; ++r)
        for (int j = p; j >= r; --j) {
            const double a0 = knots[static_cast<std::size_t>(j + k - p)];
            const double a1 = knots[static_cast<std::size_t>(j + 1 + k - r)];
            const double alpha = (a1 - a0) == 0.0 ? 0.0 : (t - a0) / (a1 - a0);
            H& dj = d[static_cast<std::size_t>(j)];
            const H& dm = d[static_cast<std::size_t>(j - 1)];
            dj = {(1 - alpha) * dm.x + alpha * dj.x, (1 - alpha) * dm.y + alpha * dj.y, (1 - alpha) * dm.w + alpha * dj.w};
        }
    const H& r = d[static_cast<std::size_t>(p)];
    return {r.x / r.w, r.y / r.w};
}

double NurbsCurve::closestParam(const Vec2& p, double t0, double t1) const {
    // Golden-section search; the bracket comes from the fine approximation,
    // so the distance is unimodal inside it.
    const double g = 0.6180339887498949;
    double a = std::max(t0, tMin()), b = std::min(t1, tMax());
    double c = b - g * (b - a), d = a + g * (b - a);
    double fc = (eval(c) - p).lengthSquared(), fd = (eval(d) - p).lengthSquared();
    for (int i = 0; i < 80 && (b - a) > 1e-15 * (1.0 + std::abs(b)); ++i) {
        if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = (eval(c) - p).lengthSquared(); }
        else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = (eval(d) - p).lengthSquared(); }
    }
    return 0.5 * (a + b);
}

std::vector<Vec2> NurbsCurve::tessellate(double tolerance, std::vector<double>* params) const {
    std::vector<Vec2> out;
    if (params) params->clear();
    if (!isValid()) return out;
    out.push_back(eval(tMin()));
    if (params) params->push_back(tMin());
    const double tol = tolerance > 0 ? tolerance : 1e-6;
    // Recursive midpoint subdivision inside each non-empty knot span.
    struct Rec {
        const NurbsCurve& c;
        double tol;
        std::vector<Vec2>& out;
        std::vector<double>* params;
        void run(double t0, const Vec2& p0, double t1, const Vec2& p1, int depth) {
            const double tm = 0.5 * (t0 + t1);
            const Vec2 pm = c.eval(tm);
            const double dev = geom::distancePointToSegment(pm, p0, p1);
            if (depth >= 14 || (dev <= tol && depth >= 2)) {
                out.push_back(p1);
                if (params) params->push_back(t1);
                return;
            }
            run(t0, p0, tm, pm, depth + 1);
            run(tm, pm, t1, p1, depth + 1);
        }
    } rec{*this, tol, out, params};
    const std::size_t n = ctrl.size();
    for (std::size_t k = static_cast<std::size_t>(degree); k < n; ++k) {
        const double a = knots[k], b = knots[k + 1];
        if (!(b > a)) continue;
        // Split each span in 4 first so S-shapes inside one span are not missed.
        Vec2 prev = eval(a);
        for (int q = 1; q <= 4; ++q) {
            const double t1 = a + (b - a) * q / 4.0;
            const Vec2 p1 = eval(t1);
            rec.run(a + (b - a) * (q - 1) / 4.0, prev, t1, p1, 0);
            prev = p1;
        }
    }
    return out;
}

namespace geom {

NurbsCurve clampedUniformSpline(const std::vector<Vec2>& ctrl, int degree) {
    NurbsCurve c;
    c.degree = std::max(1, std::min(degree, static_cast<int>(ctrl.size()) - 1));
    c.ctrl = ctrl;
    const int n = static_cast<int>(ctrl.size()), p = c.degree;
    const int interior = n - p - 1;
    for (int i = 0; i <= p; ++i) c.knots.push_back(0.0);
    for (int i = 1; i <= interior; ++i) c.knots.push_back(static_cast<double>(i) / (interior + 1));
    for (int i = 0; i <= p; ++i) c.knots.push_back(1.0);
    return c;
}

NurbsCurve closedUniformSpline(const std::vector<Vec2>& ctrl, int degree) {
    NurbsCurve c;
    c.degree = std::max(1, std::min(degree, static_cast<int>(ctrl.size()) - 1));
    c.ctrl = ctrl;
    for (int i = 0; i < c.degree; ++i) c.ctrl.push_back(ctrl[static_cast<std::size_t>(i)]); // wrap
    const std::size_t m = c.ctrl.size() + static_cast<std::size_t>(c.degree) + 1;
    for (std::size_t i = 0; i < m; ++i) c.knots.push_back(static_cast<double>(i));
    return c;
}

namespace {
// Non-zero basis functions N[span-p .. span] at u (A2.2).
void basisFuns(int span, double u, int p, const std::vector<double>& U, std::vector<double>& N) {
    N.assign(static_cast<std::size_t>(p) + 1, 0.0);
    std::vector<double> left(static_cast<std::size_t>(p) + 1), right(static_cast<std::size_t>(p) + 1);
    N[0] = 1.0;
    for (int j = 1; j <= p; ++j) {
        left[static_cast<std::size_t>(j)] = u - U[static_cast<std::size_t>(span + 1 - j)];
        right[static_cast<std::size_t>(j)] = U[static_cast<std::size_t>(span + j)] - u;
        double saved = 0.0;
        for (int r = 0; r < j; ++r) {
            const double denom = right[static_cast<std::size_t>(r + 1)] + left[static_cast<std::size_t>(j - r)];
            const double temp = denom == 0.0 ? 0.0 : N[static_cast<std::size_t>(r)] / denom;
            N[static_cast<std::size_t>(r)] = saved + right[static_cast<std::size_t>(r + 1)] * temp;
            saved = left[static_cast<std::size_t>(j - r)] * temp;
        }
        N[static_cast<std::size_t>(j)] = saved;
    }
}

int findSpan(int n, int p, double u, const std::vector<double>& U) { // n = last control index
    if (u >= U[static_cast<std::size_t>(n + 1)]) return n;
    int lo = p, hi = n + 1;
    while (hi - lo > 1) {
        const int mid = (lo + hi) / 2;
        if (u >= U[static_cast<std::size_t>(mid)]) lo = mid; else hi = mid;
    }
    return lo;
}
} // namespace

std::optional<NurbsCurve> interpolateSpline(const std::vector<Vec2>& Q, int degree) {
    // Remove consecutive duplicates (they would give zero chord lengths).
    std::vector<Vec2> pts;
    for (const Vec2& q : Q)
        if (pts.empty() || !nearlyEqual(pts.back(), q, 0.0)) pts.push_back(q);
    if (pts.size() < 2) return std::nullopt;
    const int n = static_cast<int>(pts.size()) - 1;
    const int p = std::max(1, std::min(degree, n));
    double total = 0.0;
    for (int k = 1; k <= n; ++k) total += distance(pts[static_cast<std::size_t>(k - 1)], pts[static_cast<std::size_t>(k)]);
    if (!(total > 0)) return std::nullopt;
    std::vector<double> ub(static_cast<std::size_t>(n) + 1, 0.0);
    for (int k = 1; k < n; ++k)
        ub[static_cast<std::size_t>(k)] = ub[static_cast<std::size_t>(k - 1)] +
                                          distance(pts[static_cast<std::size_t>(k - 1)], pts[static_cast<std::size_t>(k)]) / total;
    ub[static_cast<std::size_t>(n)] = 1.0;

    NurbsCurve c;
    c.degree = p;
    for (int i = 0; i <= p; ++i) c.knots.push_back(0.0);
    for (int j = 1; j <= n - p; ++j) {
        double s = 0.0;
        for (int i = j; i <= j + p - 1; ++i) s += ub[static_cast<std::size_t>(i)];
        c.knots.push_back(s / p);
    }
    for (int i = 0; i <= p; ++i) c.knots.push_back(1.0);

    // Solve A * P = Q (dense, partial pivoting; A is banded so this is stable).
    const std::size_t N = static_cast<std::size_t>(n) + 1;
    std::vector<double> A(N * N, 0.0);
    std::vector<double> bx(N), by(N);
    std::vector<double> basis;
    for (int k = 0; k <= n; ++k) {
        const int span = findSpan(n, p, ub[static_cast<std::size_t>(k)], c.knots);
        basisFuns(span, ub[static_cast<std::size_t>(k)], p, c.knots, basis);
        for (int j = 0; j <= p; ++j)
            A[static_cast<std::size_t>(k) * N + static_cast<std::size_t>(span - p + j)] = basis[static_cast<std::size_t>(j)];
        bx[static_cast<std::size_t>(k)] = pts[static_cast<std::size_t>(k)].x;
        by[static_cast<std::size_t>(k)] = pts[static_cast<std::size_t>(k)].y;
    }
    for (std::size_t col = 0; col < N; ++col) {
        std::size_t piv = col;
        for (std::size_t r = col + 1; r < N; ++r)
            if (std::abs(A[r * N + col]) > std::abs(A[piv * N + col])) piv = r;
        if (std::abs(A[piv * N + col]) < 1e-14) return std::nullopt;
        if (piv != col) {
            for (std::size_t j = 0; j < N; ++j) std::swap(A[col * N + j], A[piv * N + j]);
            std::swap(bx[col], bx[piv]);
            std::swap(by[col], by[piv]);
        }
        for (std::size_t r = col + 1; r < N; ++r) {
            const double f = A[r * N + col] / A[col * N + col];
            if (f == 0.0) continue;
            for (std::size_t j = col; j < N; ++j) A[r * N + j] -= f * A[col * N + j];
            bx[r] -= f * bx[col];
            by[r] -= f * by[col];
        }
    }
    c.ctrl.assign(N, Vec2{});
    for (std::size_t i = N; i-- > 0;) {
        double sx = bx[i], sy = by[i];
        for (std::size_t j = i + 1; j < N; ++j) { sx -= A[i * N + j] * c.ctrl[j].x; sy -= A[i * N + j] * c.ctrl[j].y; }
        c.ctrl[i] = {sx / A[i * N + i], sy / A[i * N + i]};
    }
    // Exact end points (avoid round-off at the ends of an interpolating curve).
    c.ctrl.front() = pts.front();
    c.ctrl.back() = pts.back();
    return c;
}

} // namespace geom
} // namespace dyncad
