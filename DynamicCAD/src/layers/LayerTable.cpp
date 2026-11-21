// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "layers/LayerTable.h"

#include <algorithm>

namespace dyncad {

StyleTables::StyleTables() {
    layers_.push_back(Layer{"0"});
    linetypes_ = builtinLinetypes();
    reindex();
}

void StyleTables::reindex() {
    exact_.clear();
    for (std::size_t i = 0; i < layers_.size(); ++i) exact_[layers_[i].name] = i;
}

bool StyleTables::validName(const std::string& n) {
    if (n.empty() || n.size() > 255) return false;
    for (char c : n)
        if (std::string("<>/\\\":;?*|,=`").find(c) != std::string::npos) return false;
    return n.front() != ' ' && n.back() != ' ';
}

const Layer* StyleTables::layer(const std::string& name) const {
    if (auto it = exact_.find(name); it != exact_.end()) return &layers_[it->second];
    const std::string u = upperName(name);
    for (const auto& l : layers_)
        if (upperName(l.name) == u) return &l;
    return nullptr;
}

Layer* StyleTables::layer(const std::string& name) {
    return const_cast<Layer*>(static_cast<const StyleTables*>(this)->layer(name));
}

bool StyleTables::addLayer(const Layer& l) {
    if (!validName(l.name)) return false;
    if (layer(l.name)) return true;
    layers_.push_back(l);
    reindex();
    return true;
}

bool StyleTables::renameLayer(const std::string& from, const std::string& to) {
    Layer* l = layer(from);
    if (!l || l->name == "0" || !validName(to) || (layer(to) && upperName(to) != upperName(from))) return false;
    if (upperName(current_) == upperName(from)) current_ = to;
    l->name = to;
    reindex();
    return true;
}

bool StyleTables::removeLayer(const std::string& name) {
    if (upperName(name) == "0" || upperName(name) == upperName(current_)) return false;
    const std::string u = upperName(name);
    auto it = std::find_if(layers_.begin(), layers_.end(), [&](const Layer& l) { return upperName(l.name) == u; });
    if (it == layers_.end()) return false;
    layers_.erase(it);
    reindex();
    return true;
}

bool StyleTables::setCurrentLayer(const std::string& name) {
    const Layer* l = layer(name);
    if (!l || l->frozen) return false;
    current_ = l->name;
    return true;
}

const Linetype* StyleTables::linetype(const std::string& name) const {
    for (const auto& lt : linetypes_)
        if (sameName(name, lt.name.c_str())) return &lt;
    return nullptr;
}

void StyleTables::addLinetype(const Linetype& lt) {
    const std::string u = upperName(lt.name);
    for (auto& e : linetypes_)
        if (upperName(e.name) == u) { e = lt; return; }
    linetypes_.push_back(lt);
}

std::vector<std::string> StyleTables::linetypeNames() const {
    std::vector<std::string> v;
    for (const auto& lt : linetypes_) v.push_back(lt.name);
    return v;
}

} // namespace dyncad
