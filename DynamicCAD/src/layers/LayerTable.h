// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "layers/Style.h"

#include <map>
#include <optional>
#include <string>
#include <vector>

namespace dyncad {

struct Layer {
    std::string name;
    CadColor color = CadColor::fromIndex(7);
    std::string linetype = kContinuous;
    int lineweight = kLwDefault;
    bool on = true;
    bool frozen = false;
    bool locked = false;
    bool plot = true;

    bool visible() const { return on && !frozen; }
    bool operator==(const Layer& o) const {
        return name == o.name && color == o.color && linetype == o.linetype && lineweight == o.lineweight && on == o.on &&
               frozen == o.frozen && locked == o.locked && plot == o.plot;
    }
};

// Drawing-wide named tables: layers and linetypes, plus the current layer and
// global linetype scale. Layer "0" always exists. Names compare case-insensitively.
class StyleTables {
public:
    StyleTables();

    const std::vector<Layer>& layers() const { return layers_; }
    const Layer* layer(const std::string& name) const;
    Layer* layer(const std::string& name);
    bool hasLayer(const std::string& name) const { return layer(name) != nullptr; }
    // Adds (or returns) a layer; returns false if the name is invalid.
    bool addLayer(const Layer& l);
    bool renameLayer(const std::string& from, const std::string& to);
    bool removeLayer(const std::string& name); // never removes "0" or the current layer
    const std::string& currentLayer() const { return current_; }
    bool setCurrentLayer(const std::string& name);

    const std::vector<Linetype>& linetypes() const { return linetypes_; }
    const Linetype* linetype(const std::string& name) const;
    void addLinetype(const Linetype& lt); // replaces a same-named one

    double ltscale() const { return ltscale_; }
    void setLtscale(double s) { if (s > 0) ltscale_ = s; }

    static bool validName(const std::string& name);

    bool operator==(const StyleTables& o) const {
        return layers_ == o.layers_ && current_ == o.current_ && ltscale_ == o.ltscale_ && linetypeNames() == o.linetypeNames();
    }

private:
    std::vector<std::string> linetypeNames() const;
    void reindex();
    std::map<std::string, std::size_t> exact_; // fast exact-name lookup
    std::vector<Layer> layers_;
    std::vector<Linetype> linetypes_;
    std::string current_ = "0";
    double ltscale_ = 1.0;
};

} // namespace dyncad
