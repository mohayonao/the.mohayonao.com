/*!
 * enzui.js / Visual Programming Laungage v0.0.1 alpha
 *
 * Copyright 2011, mohayonao
 */
(function(window, undefined) {

// Use the correct document accordingly with window argument (sandbox)    
var document  = window.document,
    navigator = window.navigator,
    location  = window.location;

var enzui = (function() {
var enzui = (function() {
    var instance = null;
    return function(opts) {
        if (opts) {
            if ("klassName" in opts && "klass" in opts) {
                return enzui.core.register(opts);
            }
        }
        if (!instance) {
            instance = new ENZSoundSystem(opts);
        }
        return instance;
    };
}());
enzui.core = function() {};

var VERSION = enzui.VERSION = "0.0.1 alpha";    


var ObjectPool = (function() {
    var ObjectPool = function() {
        this._list = [];
        this._dict = {};
    }, $this = ObjectPool.prototype;

    $this.clear = function() {
        this._list = [];
        this._dict = {};
    };
    
    $this.set = function(id, object) {
        var _list, _dict, find, i;
        
        _list = this._list;
        _dict = this._dict;
        if (id in _dict) {
            find = -1;
            for (i = _list.length; i--; ) {
                if (_list[i].id === id) {
                    find = i; break;
                }
            }
            if (find !== -1) {
                _list.splice(find, 1, object);
            }
        } else {
            _list.push(object);
        }
        _dict[id] = object;
    };
    $this.del = function(id) {
        var _list, _dict, find, i;
        
        _list = this._list;
        _dict = this._dict;
        if (id in _dict) {
            find = -1;
            for (i = _list.length; i--; ) {
                if (_list[i].id === id) {
                    find = i; break;
                }
            }
            if (find !== -1) {
                _list.splice(find, 1);
            }
            delete _dict[id];
        }        
    };
    $this.get = function(id) {
        return this._dict[id] || null;
    };
    $this.list = function() {
        return this._list;
    };
    $this.forEach = function(f) {
        return this._list.forEach(f);
    };
    $this.filter = function(cond) {
        return this._list.filter(cond);
    };
    $this.sort = function(func) {
        this._list.sort(func);
    };
    return ObjectPool;
}());
enzui.core.ObjectPool = ObjectPool;    


var ENZSoundSystem = (function() {
    var ENZSoundSystem = function() {
        this._player = pico;
        this._windows = new ObjectPool();
        this._streamsize = pico.cellsize * pico.channels;
        console.info("START: enzui.js v" + VERSION +
                     ", samplerate=" + pico.samplerate + " " +
                     ((pico.channels === 2) ? "(stereo)" : "(mono)"));
    }, $this = ENZSoundSystem.prototype;
    
    $this.newPatcherWindow = function(name, options) {
        var w;
        w = this._windows.get(name);
        if (!w) {
            w = new enzui.core.ENZPatcherWindow(this, options);
            this._windows.set(name, w);
        }
        return w;
    };
    
    $this.playerprofile = function() {
        return {SAMPLERATE       : pico.samplerate,
                CHANNEL          : pico.channels,
                STREAM_CELL_SIZE : pico.cellsize,
                STREAM_CELL_COUNT: 1};
    };
    
    $this.start = function() {
        this._player.play(this);
    };
    
    $this.stop = function() {
        this._player.stop();
    };
    
    $this.process = function(L, R) {
        var stream, list, p, s;
        var i, imax, j;
        
        stream = new Float32Array(this._streamsize);
        list = this._windows.list();
        for (i = list.length; i--; ) {
            p = list[i];
            if (p.runmode) {
                s = p.next();
                for (j = stream.length; j--; ) {
                    stream[j] += s[j];
                }
            }
        }
        
        // clipping
        for (i = stream.length; i--; ) {
            if (stream[i] < -1.0) {
                stream[i] = -1.0;
            } else if (1.0 < stream[i]) {
                stream[i] = 1.0;
            }
        }
        for (i = j = 0, imax = L.length; i < imax; ++i) {
          L[i] = stream[j++] * 0.6;
          R[i] = stream[j++] * 0.6;
        }
        return stream;
    };
    
    return ENZSoundSystem;
}());
enzui.core.ENZSoundSystem = ENZSoundSystem;

return enzui;
}());


// const
var INLET   = 0;
var OUTLET  = 1;
var BANG    = 0;
var NUMBER  = 6;
var INT     = 1;
var FLOAT   = 2;
var LIST    = 3;
var STRING  = 4;
var ANY     = 5;
var INFINITE_LOOP_LIMIT = 2500;
var NOP     = function() {};    

// $const
enzui.$const = (function() {
    var map = {
        INLET:INLET, OUTLET:OUTLET,
        BANG:BANG, NUMBER:NUMBER, INT:INT, FLOAT:FLOAT, LIST:LIST, STRING:STRING, ANY:ANY,
        INFINITE_LOOP_LIMIT:INFINITE_LOOP_LIMIT, NOP:NOP
    };
    return function(name) {
        return map[name];
    };
}());



var ENZPatchNode = (function() {
    var ENZPatchNode = function(objectbox, type, index) {
        this.objectbox = objectbox;
        this.type  = type;
        this.index = index;
        this.edges = [];
        this.x = 0;
        this.y = 0;
        this.msp = false;
        this.signal = false;
    }, $this = ENZPatchNode.prototype;
    
    $this.destroy = function() {
        var list, i;
        list = this.edges;
        for (i = list.length; i--; ) {
            list[i].destroy();
        }
        this.objectbox.removePatchNode(this);
    };
    
    $this.addPatchEdge = function(target) {
        var inlet, outlet;
        var list, edge;
        
        if (this.type === INLET) {
            inlet  = this;
            outlet = target;
        } else if (this.type === OUTLET) {
            inlet  = target;
            outlet = this;
        } else {
            console.warn("invalid inlet/outlet???");
            return null;
        }
        
        edge = inlet.edges.filter(function(n) {
            return n.outlet.objectbox === outlet.objectbox &&
                n.outlet.index === outlet.index;
        });
        
        if (edge.length === 0) {
            edge = new ENZPatchEdge(outlet, inlet);
            outlet.edges.push(edge);
            inlet .edges.push(edge);
            inlet.objectbox.onconnect(outlet.objectbox, edge);
        } else {
            edge = edge[0];
        }
        
        return edge;
    };

    $this.removePatchEdge = function(edge) {
        var i, j;
        j = this.edges.indexOf(edge);
        if (j !== -1) this.edges.splice(j, 1);
        if (this.type === INLET) {
            this.objectbox.patch.removePatchEdge(edge);
        }
    };
    
    return ENZPatchNode;
}());


var ENZPatchEdge = (function() {
    var PI2 = Math.PI * 2;
    var ENZPatchEdge = function(node1, node2) {
        if (node1.type === OUTLET) {
            this.outlet = node1;
            this.inlet  = node2;
        } else {
            this.outlet = node2;
            this.inlet  = node1;
        }
        this.segments = [];
        this.selected = false;
        this.segmentIndex = -1;
    }, $this = ENZPatchEdge.prototype;
    
    $this.destroy = function() {
        var list, i;
        list = this.segments;
        for (i = list.length; i--; ) {
            list[i].destroy();
        }
        this.outlet.removePatchEdge(this);
        this.inlet .removePatchEdge(this);
    };
    
    $this.move = $this.resize = NOP;
    
    $this.addPatchSegment = function(index, x, y) {
        var list, s, i, imax;
        list = this.segments;
        if (index === null || list.length >= index) {
            s = new ENZPatchSegment(this, x, y);
            s.index = list.length;
            list.push(s);
        } else {
            s = new ENZPatchSegment(this, x, y);
            list.splice(index, 0, s);
            for (i = index, imax = list.length; i < imax; i++) {
                list[i].index = i;
            }
        }
        return s;
    };
    
    $this.removePatchSegment = function(segment) {
        var list, i;
        
        list = this.segments;
        i = list.indexOf(segment);
        if (i !== -1) {
            list.splice(i, 1);
            list.forEach(function(n, j) { n.index = i + j; });
        }
        
        this.outlet.objectbox.patch.removePatchSegment(segment);
    };
    
    $this.find = function(pos) {
        var o1, o2;
        var segments;
        var x, y, x1, y1, x2, y2;
        var i, imax;
        
        x = pos.x;
        y = pos.y;
        
        o1 = this.outlet.objectbox;
        o2 = this.inlet.objectbox;
        segments = this.segments;
        
        x1 = o1.x + o1.patchNodes[OUTLET][this.outlet.index].x;
        y1 = o1.y + o1.height;
        
        for (i = 0, imax = segments.length; i < imax; i++) {
            x2 = segments[i].x;
            y2 = segments[i].y;
            
            if (x2 - 4 <= x && x <= x2 + 4) {
                if (y2 - 4 <= y && y <= y2 + 4) {
                    return segments[i];
                }
            }
            
            if (isPointInPath(x, y, x1, y1, x2, y2)) {
                this.segmentIndex = i;
                return this;
            }
            x1 = x2;
            y1 = y2;
        }
        x2 = o2.x + o2.patchNodes[INLET][this.inlet.index].x;
        y2 = o2.y;
        
        if (isPointInPath(x, y, x1, y1, x2, y2)) {
            this.segmentIndex = i;
            return this;
        }
        
        return null;
    };
    
    $this.draw = function(painter) {
        var o1, o2, segments;
        var x1, x2, y1, y2;
        var path, color, lineWidth;
        var i;
        
        o1 = this.inlet.objectbox;
        o2 = this.outlet.objectbox;
        segments = this.segments;
        
        path = [];
        x1 = o1.x + o1.patchNodes[INLET][this.inlet.index].x;
        y1 = o1.y + o1.patchNodes[INLET][this.inlet.index].y;
        /*
        path.push(x1, y1);
        for (i = segments.length - 1; i >= 0; i--) {
            x2 = segments[i].x;
            y2 = segments[i].y;
            path.push(x2, y2);
            x1 = x2;
            y1 = y2;
        }
        */
        x2 = o2.x + o2.patchNodes[OUTLET][this.outlet.index].x;
        y2 = o2.y + o2.patchNodes[OUTLET][this.outlet.index].y;
        path.push(x2, y2);
        
        o1 = this.outlet.objectbox.objectbody;
        if (o1.MSP) {
            if (o1.mspOutlets[this.outlet.index]) {
                color = this.selected ? "red" : "darkorange";    
                lineWidth = 2;
            } else {
                color = this.selected ? "red" : "gray";
                lineWidth = 1;
            }
        } else {
            color = this.selected ? "red" : "gray";
            lineWidth = 1;
        }
        // painter.path(path, color, lineWidth);
        painter.save();
        painter.lineWidth = lineWidth;
        painter.bezierline(x1, y1, x2, y2, color);
        painter.restore();
    };

    
    var isPointInPath = function(x, y, x1, y1, x2, y2) {
        var dx, dy, x3, y3, _;
        var minx, maxx, miny, maxy;
        var m = 2;
        
        if (x1 < x2) {
            minx = x1;
            maxx = x2;
        } else {
            minx = x2;
            maxx = x1;
        }

        if (y1 < y2) {
            miny = y1;
            maxy = y2;
        } else {
            miny = y2;
            maxy = y1;
        }
        
        if (minx - m <= x && x <= maxx + m && miny - m <= y && y <= maxy + m) {
            dx = (x1 - x2);
            if (Math.abs(dx) > 0) {
                dy = (y1 - y2);
                y3 = y1 + (x - x1) * (dy / dx);
                if (Math.abs(y - y3) < m) {
                    return true;
                }
            } else {
                x3 = x1;
                if (Math.abs(x - x3) < m) {
                    return true;
                }
            }
        }
        return false;
    };
    
    return ENZPatchEdge;
}());


var ENZPatchSegment = (function() {
    var ENZPatchSegment = function(edge, x, y) {
        this.edge = edge;
        this.x = x;
        this.y = y;
        this.index = 0;
        this.selected = false;
    }, $this = ENZPatchSegment.prototype;
    
    $this.destroy = function() {
        this.edge.removePatchSegment(this);
    };
    
    $this.move = function(x, y, dx, dy) {
        this.x += dx;
        this.y += dy;
    };
    
    $this.resize = NOP;
    
    return ENZPatchSegment;
}());

    
var ENZGraphManager = (function() {
    var ENZGraphManager = function() {
        this.allEdges    = [];
        this.allSegments = [];
    }, $this = ENZGraphManager.prototype;

    $this.addPatchNode = function(objectbox, type, index) {
        return new ENZPatchNode(objectbox, type, index);
    };
    
    $this.addPatchEdge = function(outNode, inNode) {
        var edge;
        edge = outNode.addPatchEdge(inNode);
        if (edge) {
            this.allEdges.push(edge);
        }
        return edge;
    };
    
    $this.addPatchSegment = function(edge, index, pos) {
        var segment;
        segment = edge.addPatchSegment(index, pos.x, pos.y);
        this.allSegments.push(segment);
        return segment;
    };
    
    $this.removePatchNode = function(node) {
        // nothing to do
    };
    
    $this.removePatchEdge = function(edge) {
        var i;
        if ((i = this.allEdges.indexOf(edge)) !== -1) {
            this.allEdges.splice(i, 1);
        }
    };
    
    $this.removePatchSegment = function(segment) {
        var i;
        if ((i = this.allSegments.indexOf(segment)) !== -1) {
            this.allSegments.splice(i, 1);
        }
    };
    
    return ENZGraphManager;
}());
enzui.core.ENZGraphManager = ENZGraphManager;    





var ENZPatcherWindow = (function() {
    var ENZPatcherWindow = function(system, options) {
        this.runmode = false;
        
        this._system   = system;
        this._view     = new enzui.gui.ENZPatcherWindowView(this, options);
        this._compiler = new enzui.core.ENZCompiler(this);
        
        this._streamsize = system._streamsize;        
        this._patches = new enzui.core.ObjectPool();
        
        this._current = new ENZPatch(this, "Main");
        this._patches.set("Main", this._current);
        this._view.patchView = this._current.view;
        
        this._patchesList = [];

        
        this._keyDownObjects  = [];
        this._keyUpObjects    = [];
        
        if (options.source) {
            this.execute(options.source);
        }
    }, $this = ENZPatcherWindow.prototype;
    
    
    $this.__defineGetter__("system", function(value) {
        return this._system;
    });
    
    $this.__defineGetter__("view", function(value) {
        return this._view;
    });
    
    $this.__defineSetter__("superlock", function(value) {
        this._view.superlock = value;
    });
    
    $this.compile = function() {
        return this._compiler.compile(this._patches.list());
    };

    $this.execute = function(source) {
        this._current.clear();
        this._compiler.execute(source, this._current);
        this._current.draw();
    };
    
    $this.draw = function() {
        this._current.draw(this._view.canvas.context);
    };

    $this.message = function(from, message) {
        switch (message) {
          case "run":
            this.runmode ? this.stop() : this.run();
            break;
        }
    };
    
    $this.run = function() {
        this.runmode = true;
        this._patchesList = this._patches.list();
        this._patchesList.forEach(function(n) {
            n.runmode = true;
        });
        this._current.run();
        this._view.message("window", "run");
    };
    
    $this.stop = function() {
        this.runmode = false;
        this._patchesList.forEach(function(n) {
            n.runmode = false;
        });
        this._current.stop();
        this._view.message("window", "stop");
    };
    
    $this.next = function() {
        var stream, list, p, s;
        var i, j;
        
        stream = new Float32Array(this._streamsize);
        list = this._patchesList;
        
        for (i = list.length; i--; ) {
            p = list[i];
            if (! p.mute) {
                s = p.next();
                for (j = stream.length; j--; ) {
                    stream[j] += s[j];
                }
            }
        }
        
        return stream;
    };

    // interaction
    var setKeyObject = function(list , object) {
        var i;
        if ((i = list.indexOf(object)) === -1) {
            list.push(object);
        }
    };
    var removeKeyObject = function(list , object) {
        var i;
        if ((i = list.indexOf(object)) !== -1) {
            list.splice(i, 1);
        }
    };
    
    $this.setKeyDownObject = function(object) {
        setKeyObject(this._keyDownObjects, object);
    };
    $this.removeKeyDownObject = function(object) {
        removeKeyObject(this._keyDownObjects, object);
    };
    $this.setKeyUpObject = function(object) {
        setKeyObject(this._keyUpObjects, object);
    };
    $this.removeKeyUpObject = function(object) {
        removeKeyObject(this._keyUpObjects, object);
    };
    $this.keydown = function(e) {
        var l, i;
        if (this.runmode) {
            l = this._keyDownObjects;
            for (i = l.length; i--; ) {
                l[i].key(e);
            }
        }
    };
    $this.keyup = function(e) {
        var l, i;
        if (this.runmode) {
            l = this._keyUpObjects;
            for (i = l.length; i--; ) {
                l[i].key(e);
            }
        }
    };
    
    return ENZPatcherWindow;
}());
enzui.core.ENZPatcherWindow = ENZPatcherWindow;


var ENZPatch = (function() {
    var ENZPatch = function(window, name) {
        var playerprofile = window.system.playerprofile();
        this.STREAM_CELL_SIZE  = playerprofile.STREAM_CELL_SIZE ;
        this.STREAM_CELL_COUNT = playerprofile.STREAM_CELL_COUNT;
        this.SAMPLERATE = playerprofile.SAMPLERATE;
        this.CHANNEL    = playerprofile.CHANNEL;
        this.mute = false;
        this.runmode = false;
        
        this._window = window;
        this._name   = name;
        this._view   = new enzui.gui.ENZPatchView(this);
        this._graph  = new enzui.core.ENZGraphManager();
        this._objects = new enzui.core.ObjectPool();
        this._streamsize = window._streamsize;

        this._aniObjectsList = [];
        this._timObjectsList = [];
        this._mspObjectsList = [];
        this._dacObjectsList = [];
        
        this._receiveObjects = {};
    }, $this = ENZPatch.prototype;
    
    $this.__defineGetter__("window", function() {
        return this._window;
    });
    
    $this.__defineGetter__("name", function() {
        return this._name;
    });

    $this.__defineGetter__("view", function() {
        return this._view;
    });

    $this.__defineGetter__("graph", function() {
        return this._graph;
    });

    $this.__defineGetter__("allEdges", function() {
        return this._graph.allEdges;
    });
    
    $this.__defineGetter__("allSegments", function() {
        return this._graph.allSegments;
    });
    
    $this.__defineGetter__("objects", function() {
        return this._objects.list();
    });

    $this.__defineGetter__("aniObjects", function() {
        return this._aniObjectsList;
    });

    $this.__defineGetter__("mspObjects", function() {
        return this._mspObjectsList;
    });

    $this.__defineGetter__("timObjects", function() {
        return this._timObjectsList;
    });

    $this.__defineGetter__("dacObjects", function() {
        return this._dacObjectsList;
    });
    
    $this.clear = function() {
        var list, i;
        this._receiveObjects = {};

        list = this._objects.list();
        for (i = list.length; i--; ) {
            list[i].destroy();
        }
        this.draw();
    };
    
    $this.install = function(program) {
        new enzui.core.ENZPatchCompiler(this).compile(program);
    };
    
    
    $this.next = function() {
        var stream = new Float32Array(this._streamsize);
        var STREAM_CELL_SIZE   = this.STREAM_CELL_SIZE;
        var STREAM_CELL_SIZExC = STREAM_CELL_SIZE * this.CHANNEL;
        var _timObjects, _mspObjects, _dacObjects;
        var s, i, imax, j, k;
        _timObjects = this._timObjectsList;
        _mspObjects = this._mspObjectsList;
        _dacObjects = this._dacObjectsList;
        
        for (i = 0, imax = this.STREAM_CELL_COUNT; i < imax; i++) {
            for (j = _mspObjects.length; j--; ) {
                _mspObjects[j].onmsr(STREAM_CELL_SIZE);
            }
            for (j = _mspObjects.length; j--; ) {
                _mspObjects[j].onmsp(STREAM_CELL_SIZE);
            }
            for (j = _timObjects.length; j--; ) {
                _timObjects[j].oninterval(STREAM_CELL_SIZE);
            }
            
            for (j = _dacObjects.length; j--; ) {
                if (! _dacObjects[j].stop) {
                    s = _dacObjects[j].ondac();
                    for (k = 0; k < STREAM_CELL_SIZExC; k++) {
                        stream[i * STREAM_CELL_SIZExC + k] += s[k];
                    }
                }
            }
        }
        return stream;
    };
    
    $this.draw = function() {
        this._view.draw();
    };

    $this.run = function() {
        var list, i, imax;
        var list2;
        
        list = this._objects.list();
        list.sort(function(a, b) {
            return -(a.hop - b.hop);
        });
        
        list2 = list.map(function(n) {
            return n.objectbody;
        });
        
        this._aniObjectsList = list.filter(function(n) {
            return n.objectbody.ANIMATE;
        });
        this._timObjectsList = list2.filter(function(n) {
            return n.INTERVAL;
        });
        this._mspObjectsList = list2.filter(function(n) {
            return n.MSP;
        });
        this._dacObjectsList = list2.filter(function(n) {
            return n.DAC;
        });
        
        for (i = 0, imax = list.length; i < imax; i++) {
            list[i].selected.selected = false;
            list[i].selected.index    = -1;
            if (list[i].objectbody.onstart) {
                list[i].objectbody.onstart();
            }
        }
        
        this._view.draw();
        this._view.animate();
    };

    $this.stop = function() {
        this._objects.list().forEach(function(n) {
            if (n.objectbody.onstop) n.objectbody.onstop();
        });
    };
    
    
    /**
     * addObject
     * add ENZObjectBox and add object's set
     */
    $this.addObject = function(command, options) {
        var object = new ENZObjectBox(this, command, options);
        this._objects.set(object.id, object);
        return object;
    };

    /**
     * addPatchEdge
     * add ENZPatchEdge and add edge's list
     */
    $this.addPatchEdge = function(outNode, inNode) {
        return this._graph.addPatchEdge(outNode, inNode);
    };
    
    $this.addPatchSegment = function(edge, pos) {
        return this._graph.addPatchSegment(edge, null, pos);
    };
    
    
    $this.removeObject = function(object) {
        if (typeof(object) === "string") {
            object = this._objects.get(object);
        }
        if (object) {
            this._objects.del(object.id);
        }
    };

    $this.removePatchEdge = function(edge) {
        this._graph.removePatchEdge(edge);
    };
    
    $this.removePatchSegment = function(segment) {
        this._graph.removePatchSegment(segment);
    };
    
    
    $this.findObjectWithXY = function(pos) {
        var _objects;
        var x, y, o, m, i;
        m = 2; // margin
        
        x = pos.x;
        y = pos.y;
        
        _objects = this._objects.list();
        for (i = _objects.length; i--; ) {
            o = _objects[i];
            if (o.x - m <= x && x <= o.x + o.width + m) {
                if (o.y - m <= y && y <= o.y + o.height + m) {
                    return o;
                }
            }
        }
        return null;
    };
    
    $this.findEdgeWithXY = function(pos) {
        var edges = this.allEdges;
        var e, i;
        for (i = edges.length; i--; ) {
            e = edges[i].find(pos);
            if (e) return e;
        }
        return null;
    };
    
    
    $this.getValueObjects = function(name) {
        return this.getReceiveObjects(name);
    };
    
    $this.setValueObject = function(name, object) {
        name = "value." + name;
        this.setReceiveObject(name, object);
    };
    
    $this.removeValueObject = function(name, object) {
        name = "value." + name;
        this.removeReceiveObject(name, object);
    };
    
    $this.getReceiveObjects = function(name) {
        var list, i;
        
        list = this._receiveObjects[name];
        if (! list) {
            list = this._receiveObjects[name] = [];
        }
        
        return list;
    };
    
    $this.setReceiveObject = function(name, object) {
        var list, i;
        
        list = this._receiveObjects[name];
        if (! list) {
            list = this._receiveObjects[name] = [];
        }
        
        if ((i = list.indexOf(object)) === -1) {
            list.push(object);
        }
    };
    
    $this.removeReceiveObject = function(name, object) {
        var list, i;
        
        list = this._receiveObjects[name];
        if (list) {
            if ((i = list.indexOf(object)) !== -1) {
                list.splice(i, 1);
            }
        }
    };

    $this.setKeyDownObject = function(object) {
        this._window.setKeyDownObject(object);
    };
    $this.removeKeyDownObject = function(object) {
        this._window.removeKeyDownObject(object);
    };
    $this.setKeyUpObject = function(object) {
        this._window.setKeyUpObject(object);
    };
    $this.removeKeyUpObject = function(object) {
        this._window.removeKeyUpObject(object);
    };
    
    return ENZPatch;
}());



var ENZObjectBox = (function() {
    var $id = 0;
    var ENZObjectBox = function(patch, command, options) {
        options = options || {};
        
        this.id   = $id++;
        this.name = options.name;
        
        this.patch = patch;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.z = options.z || 0;
        this.width  = options.width  || 40;
        this.height = options.height || 20;
        
        this.hop = 0;
        this.patchNodes = [ [], [] ]; // inlets, outlets
        this.selected = { selected:false, type:INLET, index:-1 };
        
        this.objectbody = enzui.core.newObjectBody(this, command);
        
        if (options.forecolor) {
            this.objectbody.forecolor = options.forecolor;
        }
        if (options.backcolor) {
            this.objectbody.backcolor = options.backcolor;
        }
    }, $this = ENZObjectBox.prototype;
    
    $this.reborn = function(command) {
        var mt, width;
        
        this.objectbody.destroy();
        this.objectbody = enzui.core.newObjectBody(this, command);
        this.autosize();
    };
    
    $this.autosize = function() {
        var body, mt, width, height;
        body = this.objectbody;
        
        mt = this.patch.view.measureText(body.str + "_");
        width  = (Math.ceil(mt.width / 10) * 10)|0;
        height = this.height;
        if (body.minWidth  && width  < body.minWidth ) width  = body.minWidth;
        if (body.maxWidth  && body.maxWidth  < width ) width  = body.maxWidth;
        if (body.minHeight && height < body.minHeight) height = body.minHeight;
        if (body.maxHeight && body.maxHeight < height) height = body.maxHeight;
        
        this.width  = width;
        this.height = height;
        
        body.onresize();
        this.calcPatchNodePosition();
    };

    $this.destroy = function() {
        var list, i;
        list = this.patchNodes[INLET];
        for (i = list.length; i--; ) {
            list[i].destroy();
        }
        this.patchNodes[INLET] = [];
        
        list = this.patchNodes[OUTLET];
        for (i = list.length; i--; ) {
            list[i].destroy();
        }
        this.patchNodes[OUTLET] = [];
        
        this.objectbody.destroy();
        
        this.patch.removeObject(this);
    };

    
    $this.draw = function(painter) {
        this.objectbody.draw(painter, this.x, this.y, this.width, this.height);
    };

    $this.onanimate = function(painter) {
        this.objectbody.onanimate(painter, this.x, this.y, this.width, this.height);
    };
    
    $this.onconnect = function(outlet, edge) {
        var disconnect;
        var edges, i, x;
        if (outlet.objectbody.MSP) {
            disconnect = true;
            if (edge.outlet.objectbox.objectbody.mspOutlets[edge.outlet.index]) {
                // msp outlet
//                 if (this.objectbody.signalInlets && this.objectbody.signalInlets.length) {
//                     if (edge.inlet.index < this.objectbody.signalInlets.length) {
//                         disconnect = false;
//                     }
//                 }
                if (this.objectbody.signalInlets && this.objectbody.signalInlets[edge.inlet.index]) {
                    disconnect = false;
                }
            } else {
                // not msp outlet
                disconnect = false;
            }
            if (disconnect) edge.destroy();

            edges = edge.inlet.edges;
            x = false;
            for (i = edges.length; i--; ) {
                if (edges[i].outlet.msp) {
                    x = true;
                    break;
                }
            }
            edge.inlet.signal = x;
        }
        if (! disconnect) {
            incHop.call(this, outlet.hop + 1);
            this.inletSort();
        }
    };
    
    $this.ondisconnect = function(target) {
        console.log("disconnect", this.objectbody.command);
        decHop.call(this);
    };
    
    var incHop = function(newHop, sentinel) {
        var outlets, edges, copy, i, j;
        if (this.hop < newHop) {
            if (!sentinel) sentinel = [];
            copy = [];
            for (i = sentinel.length; i--; ) {
                if (sentinel[i] === this) {
                    console.warn("patch looping???");
                    return;
                }
                copy.push(sentinel[i]);
            }
            copy.push(this);
            this.hop = newHop;
            outlets = this.patchNodes[OUTLET];
            for (i = outlets.length; i--; ) {
                edges = outlets[i].edges;
                for (j = edges.length; j--; ) {
                    incHop.call(edges[j].inlet.objectbox, newHop + 1, copy);
                }
            }
        }
    };

    $this.removePatchNode = function(node) {
        this.patchNodes[node.type].splice(node.index, 1);
        this.calcPatchNodePosition();
    };
    
    var decHop = function(sentinel) {
        var inlets, outlets, edges, copy, i, j;
        var maxHop = -1;
        inlets = this.patchNodes[INLET];
        for (i = inlets.length; i--; ) {
            edges = inlets[i].edges;
            for (j = edges.length; j--; ) {
                if (maxHop < edges[j].outlet.objectbox.hop) {
                    maxHop = edges[j].outlet.objectbox.hop;
                }
            }
        }
        
        if (maxHop + 1 < this.hop) {
            if (!sentinel) sentinel = [];
            copy = [];
            for (i = sentinel.length; i--; ) {
                if (sentinel[i] === this) {
                    console.warn("patch looping???");
                    return;
                }
                copy.push(sentinel[i]);
            }
            copy.push(this);
            
            this.hop = maxHop + 1;
            outlets = this.patchNodes[OUTLET];
            for (i = outlets.length; i--; ) {
                edges = outlets[i].edges;
                for (j = edges.length; j--; ) {
                    decHop.call(edges[j].inlet.objectbox, copy);
                }
            }
        }
    };
    
    $this.calcPatchNodePosition = (function() {
        var exec = function(type) {
            var list;
            var n, m, dw, dx, y, i;
            list = this.patchNodes[type];
            n = list.length;
            if (n > 0) {
                y = (type === INLET) ? 0 : this.height;
                if (n > 1) {
                    m = n - 1;
                    if (m % 2) {
                        dw = (this.width - m) / m;
                    } else {
                        dw = (this.width - (m-1)) / m;
                    }
                    dx = 0;
                    for (i = 0; i < n - 1; i++) {
                        list[i].x = (dx+0.5)|0;
                        list[i].y = y;
                        dx += dw;
                    }
                    list[i].x = this.width;
                    list[i].y = y;
                } else {
                    list[0].x = 0;
                    list[0].y = y;
                }
            }
        };
        
        return function() {
            exec.call(this, INLET);
            exec.call(this, OUTLET);
        };
    }());
    
    
    $this.outletSort = function(index) {
        this.patchNodes[OUTLET][index].edges.sort(function(a, b) {
            a = a.inlet.objectbox;
            b = b.inlet.objectbox;
            if (a.x !== b.x) {
                return a.x - b.x;
            }
            if (a.y !== b.y) {
                return a.y - b.y;
            }
            return a.id - b.id;
        });
    };
    
    $this.inletSort = function() {
        var inlets, edges;
        var i, j;
        inlets = this.patchNodes[INLET];
        for (i = inlets.length; i--; ) {
            edges = inlets[i].edges;
            for (j = edges.length; j--; ) {
                edges[j].outlet.objectbox.outletSort(edges[j].outlet.index);
            }
        }
    };


    $this.setPatchNode = (function() {
        var exec = function(type, num, objectbody) {
            var _graph;
            var list, diff, node, notMSP, len;
            var i, imax;
            
            _graph = this.patch._graph;
            list  = this.patchNodes[type];
            diff  = list.length - num;

            if (diff < 0) {
                for (i = 0, imax = -diff; i < imax; i++) {
                    node = _graph.addPatchNode(this, type, i);
                    list.push(node);
                }
            } else {
                for (i = num, imax = list.length; i < imax; i++) {
                    list[i].destroy();
                }
                list = list.slice(0, num);
            }

            notMSP = false;
            if (! objectbody.MSP) {
                notMSP = true;
            } else {
                if (type === INLET) {
                    if (objectbody.signalInlets && objectbody.signalInlets.length) {
                        len = objectbody.signalInlets.length;
                        for (i = list.length; i--; ) {
                            list[i].msp = i < len;
                        }
                    } else {
                        notMSP = true;
                    }
                } else { // OUTLET

                    for (i = list.length; i--; ) {
                        list[i].msp = objectbody.mspOutlets[i];
                    }
                }
            }
            if (notMSP) {
                for (i = list.length; i--; ) {
                    list[i].msp = false;
                }
            }
        };
        
        return function(objectbody) {
            objectbody.onresize();
            exec.call(this, INLET , objectbody.inlets , objectbody);
            exec.call(this, OUTLET, objectbody.outlets, objectbody);
            this.calcPatchNodePosition();
        };
    }());
    
    $this.selectPatchNode = function(x, y, viewOptions) {
        var list, i, m;
        m = 3;
        this.selected.index = -1;
        if (x !== null) {
            if (-m < y && y <= m) {
                this.selected.type = INLET;
                list = this.patchNodes[INLET];
            } else if (this.height - m <= y && y < this.height + m) {
                this.selected.type = OUTLET;
                list = this.patchNodes[OUTLET];
            } else {
                list = [];
            }
            for (i = list.length; i--; ) {
                if (list[i].x - m <= x && x <= list[i].x + m) {
                    this.selected.index = i;
                    break;
                }
            }
        }
    };
    
    
    $this.move = function(x, y, dx, dy) {
        this.x += dx;
        this.y += dy;
        this.inletSort();
    };
    
    
    $this.resize = function(x, y, dx, dy) {
        var width;
        
        width = this.width + dx;
        if (width < 40) width = 40;
        
        if (this.width !== width) {
            this.width = width;
            this.objectbody.onresize();
            this.calcPatchNodePosition();
        }
    };

    $this.getValueObjects = function(name) {
        return this.patch.getValueObjects(name);
    };
    $this.setValueObject = function(name, object) {
        this.patch.setValueObject(name, object);
    };
    $this.removeValueObject = function(name, object) {
        this.patch.removeValueObject(name, object);
    };
    
    
    $this.getReceiveObjects = function(name) {
        return this.patch.getReceiveObjects(name);
    };
    $this.setReceiveObject = function(name, object) {
        this.patch.setReceiveObject(name, object);
    };
    $this.removeReceiveObject = function(name, object) {
        this.patch.removeReceiveObject(name, object);
    };

    $this.setKeyDownObject = function(object) {
        this.patch.setKeyDownObject(object);
    };

    $this.removeKeyDownObject = function(object) {
        this.patch.removeKeyDownObject(object);
    };

    $this.setKeyUpObject = function(object) {
        this.patch.setKeyUpObject(object);
    };

    $this.removeKeyUpObject = function(object) {
        this.patch.removeKeyUpObject(object);
    };
    
    
    $this.dump = function() {
        var lines = [];

        lines.push(this.objectbody.command);
        lines.push("hop:" + this.hop);
        lines.push("X:" + this.x);
        lines.push("Y:" + this.y);
        
        return lines.join(", ");
    };
    
    return ENZObjectBox;
}());
enzui.core.ENZObjectBox = ENZObjectBox;    





var ENZCompiler = (function() {
    var ENZCompiler = function(window) {
        this.window = window;
        this._map   = null;
    }, $this = ENZCompiler.prototype;
    
    var getSystemCommands = function(source) {
        var x, re = /\$([A-Z]+)=([-+a-zA-Z0-9_.,]+)/g;
        var result = [];
        while ((x = re.exec(source)) !== null) {
            result.push({index:re.lastIndex, type:"system",
                         attr:x[1], value:x[2]});
        }
        return result;
    };
    
    var getObjectCommands = function(source) {
        var x, re = /\[([a-zA-Z_]\w*)\s+([-+]?\d+),([-+]?\d+)(?:,(\d+)(?:,(\d+))?)?\s+(.*?)\]/g;
        var result = [];
        while ((x = re.exec(source)) !== null) {
            result.push({index:re.lastIndex, type:"object",
                         name:x[1], x:x[2]|0, y:x[3]|0,
                         width:x[4]|0, height:x[5]|0, command:x[6]});
        }
        return result;
    };
    
    var getPatchCommands = function(source) {
        var x, re = /\(([a-zA-Z_]\w*):(\d+)->(?:([-+]?\d+(?:,[-+]?\d+)+)->)?(\d+):([a-zA-Z_]\w*)\)/g;
        var result = [];
        while ((x = re.exec(source)) !== null) {
            result.push({index:re.lastIndex, type:"edge",
                         o_object:x[1], o_index:x[2]|0,
                         i_object:x[5], i_index:x[4]|0,
                         segments:x[3]});
        }
        return result;
    };
    
    var getCommands = function(source) {
        var result, i;
        
        result = [];
        
        i = source.indexOf("###");
        if (i > 0 && source[i-1] === "\n") {
            source = source.substr(0, i);
        }
        
        source = source.replace(/#.*$/gm, "");
        result = result.concat(getSystemCommands(source));
        result = result.concat(getObjectCommands(source));
        result = result.concat(getPatchCommands(source));
        result.sort(function(a,b) { return a.index - b.index; });
        
        return result;
    };

    var doSystemCommand = function(patch, cmd) {
        var items;
        if (cmd.attr === "XY") {
            items = cmd.value.split(",").map(function(n) {return n|0;});
            patch.view.point = {x:items[0]||0, y:items[1]||0};
        } else if (cmd.attr === "ZOOM") {
            patch.view.zoom = (cmd.value|0) || 1.0;
        }
    };
    
    var doObjectCommand = function(patch, cmd) {
        var o;
        o = this._map[cmd.name] = patch.addObject(cmd.command, cmd);
        if (cmd.width === 0 && cmd.height === 0) {
            o.autosize();
        }
    };
    
    var doPatchCommand = function(patch, cmd) {
        var o_object, i_object, o_node, i_node;
        var edge, segments, i, imax;
        o_object = this._map[cmd.o_object];
        i_object = this._map[cmd.i_object];
        
        if (o_object && i_object) {
            o_node = o_object.patchNodes[OUTLET][cmd.o_index - 1];
            i_node = i_object.patchNodes[INLET ][cmd.i_index - 1];
            if (o_node && i_node) {
                edge = patch.addPatchEdge(o_node, i_node);
                segments = cmd.segments;
                if (segments) {
                    segments = segments.split(/(?=.),(?=.)?/).map(function(n) {
                        return n|0;
                    });
                    for (i = 0, imax = segments.length; i < imax; i += 2) {
                        patch.addPatchSegment(edge, {x:segments[i]||0, y:segments[i+1]||0});
                    }
                }
            }
        }
    };
    
    $this.execute = function(source, defaultPatch) {
        var i, imax, list, patch, cmd;
        
        patch = defaultPatch;
        list  = getCommands(source);
        
        this._map = {};
        for (i = 0, imax = list.length; i < imax; i++) {
            cmd = list[i];
            switch (cmd.type) {
              case "system":
                doSystemCommand.call(this, patch, cmd);
                break;
              case "object":
                doObjectCommand.call(this, patch, cmd);
                break;
              case "edge":
                doPatchCommand.call(this, patch, cmd);
                break;
            }
            
        }
        this._map = null;
    };

    var makeid = function(id) {
        id = "00000" + id;
        return "_" + id.substr(id.length - 5);
    };
    
    $this.compile = function(patches) {
        var p, o, id1, id2;
        var arg1, arg2;
        var node1, node2, segments;
        var list, i, imax, j, jmax, k, kmax;
        var result;

        result = [];
        for (i = 0, imax = patches.length; i < imax; i++) {
            p = patches[i];
            result.push("# patch[" + i + "]");
            arg1 = p.view.point.x;
            arg2 = p.view.point.y;
            result.push("$XY=" + arg1 + "," + arg2);
            arg1 = p.view.zoom;
            result.push("$ZOOM=" + arg1);
            
            list = p.objects.slice(0).sort(function(a, b) {
                return (a.name < b.name) ? -1 : +1;
            });
            for (j = 0, jmax = list.length; j < jmax; j++) {
                o = list[j];
                id1 = o.name || makeid(o.id);
                result.push("[" + id1 + " " + (o.x|0) + "," + (o.y|0) +"," + (o.width|0) + "," + (o.height|0) + " " + o.objectbody.command + "];");
            }
            
            list = p.allEdges;
            for (j = list.length - 1; j >= 0; j--) {
                o = list[j];
                id1 = o.outlet.objectbox.name || makeid(o.outlet.objectbox.id);
                id2 = o.inlet .objectbox.name || makeid(o.inlet .objectbox.id);
                arg1 = o.outlet.index;
                arg2 = o.inlet .index;
                node1 = id1 + ":" + (arg1 + 1);
                node2 = (arg2 + 1) + ":" + id2;
                segments = [];
                for (k = 0, kmax = o.segments.length; k < kmax; k++) {
                    segments.push(o.segments[k].x|0, o.segments[k].y|0);
                }

                if (segments.length === 0) {
                    result.push("(" + node1 + "->" + node2 + ");");
                } else {
                    result.push("(" + node1 + "->" + segments.join(",") + "->" + node2 + ");");
                }
            }         
        }
        
        return result.join("\n");
    };
    
    return ENZCompiler;
}());
enzui.core.ENZCompiler = ENZCompiler;    






var ENZBaseObject = (function() {
    var ENZBaseObject = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZBaseObject.prototype;
    
    var KlassMethodMap = ENZBaseObject.KlassMethodMap = {};
    
    $this.inlets    = 0;
    $this.outlets   = 0;
    $this.forecolor = "black";
    $this.backcolor = "white";
    $this.minWidth  = 40;
    $this.minHeight = 20;
    
    $this.initialize = function(objectbox, command, args) {
        var i, name;
        
        this.objectbox = objectbox;
        this.command = command;
        
        if (args) {
            this.args = (function(self, args) {
                var list, map;
                var k, v;
                var items, i, imax, j;
                
                list = [];
                map  = {};
                
                items = args.split(/\s+/);
                for (i = 0, imax = items.length; i < imax; i++) {
                    if (items[i] === "") continue;
                    if ((j = items[i].indexOf("=")) === -1) {
                        list.push(items[i]);
                    } else {
                        k = items[i].substr(0, j);
                        v = items[i].substr(j+1);
                        if (!isNaN(v)) v = +v;
                        map[k] = v;
                    }
                }
                
                self.defaults = map;
                
                return list;
            }(this, args));
        } else {
            this.args = [];
            this.defaults = {};
        }
        
        i = command.indexOf(" ");
        if (i === -1) i = command.length;
        name = command.substr(0, i);
        
        this.str = name + " " + this.args.join(" ");
        
        (function(self) {
            var pp, key;
            pp = objectbox.patch.window.system.playerprofile();
            for (key in pp) self[key] = pp[key];
        }(this));
    };
    
    
    $this.__initializeFunctions = [ $this.initialize ];
    $this.__initialize = function() {
        var list, i;
        list = this.__initializeFunctions;
        for (i = list.length; i--; ) {
            list[i].apply(this, arguments);
        }
    };
    

    // utilities
    $this.toList = function(value) {
        var list, i, imax;
        
        list = value.split(/\s+/);
        
        for (i = list.length; i--; ) {
            if (isNaN(list[i])) return false;
        }
        
        for (i = 0, imax = list.length; i < imax; i++) {
            list[i] = +list[i];
        }
        
        return list;
    };

    $this.getSignalOutlets = function(index) {
        var list, outlets, i, e;
        outlets = [];
        list = this.objectbox.patchNodes[1][index].edges;
        for (i = list.length; i--; ) {
            e = list[i];
            outlets.push(e.inlet.objectbox.objectbody.signalInlets[e.inlet.index]);
        }
        return outlets;
    };
    
    $this.castINT = function(v) {
        return v|0;
    };
    
    $this.castFLOAT = function(v) {
        return +v;
    };

    $this.castSTR = function(v) {
        return ""+v;
    };

    var NOP = $this.NOP = function() {};
    
    $this.getSignalModes = function() {
        var nodes, edges;
        var i, j, x;
        var result = [];
        
        nodes = this.objectbox.patchNodes[0];
        for (i = 0; i < nodes.length; i++) {
            edges = nodes[i].edges;
            x = false;
            for (j = edges.length; j--; ) {
                if (edges[j].outlet.msp) {
                    x = true;
                    break;
                }
            }
            result[i] = x;
        }
        
        return result;
    };
    
    $this.resetSignals = function() {
        var list, inlets, i, j, s;
        if (this.signalInlets) {
            inlets = this.objectbox.patchNodes[0];
            for (i = inlets.length; i--; ) {
                if (inlets[i].signal) {
                    s = this.signalInlets[i];
                    for (j = s.length; j--; ) s[j] = 0.0;
                }
            };
        }
    };
    
    
    $this.toString = function() { return this.str; };
    $this.destroy  = NOP;
    $this.onresize = NOP;
    
    $this.onreceive = function(inlet, value, event, count) {
        var x, func;
        
        switch (value.type) {
          case BANG:
            if (this.$bang) this.$bang(inlet, value, event, count);
            break;
          case NUMBER:
            if (this.$number) this.$number(inlet, value, event, count);
            break;
          case LIST:
            if (this.$list) this.$list(inlet, value, event, count);
            break;
          case STRING:
            if ((x = (value.value + " ").indexOf(" ")) !== -1 &&
                (func = this.__keywordFunctions[value.value.substr(0, x)])) {
                func.call(this, inlet,
                          {type:STRING, value:value.value.substr(x+1)},
                          event, count);
            } else if (this.$string) {
                this.$string(inlet, value, event, count);
            }
            break;
        }
    };
    
    var str2val = $this.str2val = function(value) {
        var x;
        if (typeof(value) === "number") {
            value = {type:FLOAT, value:value};
        } else {
            if (value === "") {
                value = {type:STRING, value:""};
            } else if (value === "bang") {
                value = {type:BANG};
            } else if (!isNaN(value)) {
                value = {type:NUMBER, value:+value};
            } else if ((x = this.toList(value))) {
                value = {type:LIST, value:x};
            } else {
                value = {type:STRING, value:value};
            }
        }
        return value;
    };
    
    
    $this.send = function(inlet, value, event, count) {
        var p, edges, target, i;
        
        if (typeof(value) !== "object") {
            value = str2val.call(this, value);
        } else if (value.type === ANY) {
            value = str2val.call(this, value.value);
        }
        
        count = count | 0;
        if (count > INFINITE_LOOP_LIMIT) {
            console.warn("infinite loop??");
        } else {
            if ((p = this.objectbox.patchNodes[OUTLET][inlet])) {
                edges = p.edges;
                for (i = edges.length; i--; ) {
                    target = edges[i].inlet;
                    target.objectbox.objectbody.onreceive(target.index, value, event, count + 1);
                }
            }
        }
    };
    
    $this.draw = function(painter, x, y, w, h, animate) {
        var border;
        if (animate) {
            border = "dimgray";
        } else {
            border = this.objectbox.selected.selected ? "red" : "dimgray";
        }
        painter.rect(x, y, w, h, border, this.backcolor);
        painter.text(this.toString(), x+2, y+4, w-4, h-4, this.forecolor);
    };
    
    return ENZBaseObject;
}());




    var IGNORES = {"$bang":1,"$int":1,"$float":1,"$list":1,"$string":1};
    var objectbodyKlasses = {};
    var abbr = {};
    var NOP = function() {};
    
    var register = function(spec) {
        var re;
        var klassName, klass;
        var  baseKlassName, baseKlass, proto, key, list, i;
        var __klasstreen, __initializeFunctions, __keywordFunctions;
        
        re = /^[-!#$%&*+./<=>?@\w]+~?$/;
        klassName = spec.klassName;
        klass     = spec.klass;
        baseKlassName = spec.extend;
        
        if (baseKlassName && !re.test(baseKlassName)) {
            console.log(baseKlassName + " is invalid.");
            baseKlassName = null;
        }
        
        proto = klass.prototype;
        proto.basedraw = ENZBaseObject.prototype.draw;

        if (! proto.initialize) {
            proto.initialize = NOP;
        }
        
        if (baseKlassName) {
            baseKlass = objectbodyKlasses[baseKlassName];
            if (baseKlass) {
                for (key in baseKlass.prototype) {
                    if (!(key in proto)) {
                        proto[key] = baseKlass.prototype[key];
                    }
                }
                proto.superclass = baseKlass.prototype;
            } else {
                console.warn("'" + klassName + "' could not extend '" + baseKlassName + "', it was not found.");
            }
        }
        if (!proto.superclass) {
            proto.superclass = ENZBaseObject.prototype;
        }
        
        for (key in proto) {
            if (key[0] === "$") {
                i = klassName + "." + key;
                ENZBaseObject.KlassMethodMap[i] = proto[key];
            }
        }
        
        proto.MSP      = !!(proto.onmsp);
        proto.DAC      = !!(proto.ondac);
        proto.INTERVAL = !!(proto.oninterval);
        proto.ANIMATE  = !!(proto.onanimate);
        proto.GUI      = !!(proto.onmousedown || proto.onmousemove || proto.onmouseup);
        
        if (proto.GUI) {
            if (!proto.onmousedown) proto.onmousedown = NOP;
            if (!proto.onmousemove) proto.onmousemove = NOP;
            if (!proto.onmouseup  ) proto.onmouseup   = NOP;
        }
        
        if (proto.MSP) {
            if (!proto.backcolor) {
                proto.backcolor = "cornsilk";    
            }
            
            if (!proto.onmsr) proto.onmsr = NOP;
            if (!proto.mspOutlets) {
                proto.mspOutlets = (function(n) {
                    var list = [];
                    while (n-- > 0) list.push(true);
                    return list;
                }(proto.outlets));
            }
        }

        if (!baseKlass) {
            for (key in ENZBaseObject.prototype) {
                if (!(key in proto)) {
                    proto[key] = ENZBaseObject.prototype[key];
                }
            }
        }
        
        if (! proto.hasOwnProperty("toString")) {
            proto.toString = ENZBaseObject.prototype.toString;
        }
        
        __initializeFunctions = [];
        list = proto.__initializeFunctions;
        for (i = 0; i < list.length; i++) {
            __initializeFunctions.push(list[i]);
        }
        __initializeFunctions.unshift(proto.initialize);
        proto.__initializeFunctions = __initializeFunctions;
        proto.initialize = ENZBaseObject.prototype.__initialize;

        __keywordFunctions = {};
        for (key in proto) {
            if (key[0] === "$" && !(key in IGNORES)) {
                __keywordFunctions[key.substr(1)] = proto[key];
              }
        }
        proto.__keywordFunctions = __keywordFunctions;
        
        
        if (klassName in objectbodyKlasses) {
            console.warn("Object '" + klassName + "' is already exists. Overwrite.");
        }
        objectbodyKlasses[klassName] = klass;
        
        
        if (spec.abbr) {
            list = spec.abbr.split(/\s+/);
            for (i = 0; i < list.length; i++) {
                abbr[list[i]] = klass;
            }
        }
        
        return klass;
    };
    enzui.core.register = register;
    
    
    var newObjectBody = function(objectbox, command) {
        var name, klass, instance, args;
        var m, i;

        klass = null;
        if (command) {
            i = command.indexOf(" ");
            if (i === -1) {
                name = command;
                args = "";
            } else {
                name = command.substr(0, i);
                args = command.substr(i + 1);
            }
            klass = abbr[name] || objectbodyKlasses[name];
        }
        
        if (klass) {
            instance = new klass(objectbox, command, args);
        } else {
            instance = new ENZBaseObject(objectbox, command);
        }
        
        objectbox.setPatchNode(instance);
        return instance;
    };
    enzui.core.newObjectBody = newObjectBody;
    




enzui.gui = {};
    
var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(f) { setTimeout(f, 1000/60); };


var ENZPatcherWindowView = (function() {
    var ENZPatcherWindowView = function(owner, options) {
        this._owner = owner;
        this._elem  = null;
        
        this._patchView  = null;
        this._canvas  = null;
        this._source  = null;
        this._toolbar = null;
        this._cursorPoint = null;
        
        this._mainTab   = null; // TODO: remove
        this._sourceTab = null;
        
        this._tabTemplate = null;
        this._currentTab  = null;
        
        initialize.call(this, options);
    }, $this = ENZPatcherWindowView.prototype;
    
    $this.__defineSetter__("superlock", function(value) {
        this._toolbar.superlock = value;
        this._patchView.superlock = value;
    });
    
    $this.__defineGetter__("superlock", function() {
        return this._patchView.superlock;
    });

    $this.__defineGetter__("owner", function() {
        return this._owner;
    });
    
    $this.__defineGetter__("canvas", function() {
        return this._canvas;
    });
    
    $this.__defineGetter__("toolbar", function() {
        return this._toolbar;
    });

    $this.__defineSetter__("patchView", function(value) {
        this._patchView = value;
        this.addTab(value.name);
    });
    
    $this.__defineGetter__("patchView", function() {
        return this._patchView;
    });
    
    $this.message = function(from, message) {
        this._toolbar.message(from, message);
    };

    $this.setCursorStyle = function(value) {
        this._elem.css("cursor", value);
    };
    
    $this.setCursorPoint = function(value) {
        this._cursorPoint.text(value.x.toFixed(1) + ", " + value.y.toFixed(1));
    };
    
    $this.buttonClick = function(from, message) {
        this._owner.message(from, message);
    };

    $this.selectTab = function(id) {
        var source = null;
        if (id === "__source__") {
            source = this._owner.compile();
            this._source.source = source;
            this._source.visible = true;
            this._canvas.visible = false;
            this._toolbar.visible = false;
        } else {
            if (this._source.isChanged) { // TODO: !!!! true !!!!
                this._owner.execute(this._source.source);
            }
            this._source.visible = false;
            this._canvas.visible = true;
            this._toolbar.visible = true;
        }
    };
    
    
    $this.addTab = function(value) {
        //         var tab = this._tabTemplate.clone(true)
        //             .attr("id", value).text(value);
        //         tab.insertBefore(this._sourceTab).click();
    };


    $this.keypress = function(e) {
        this._owner.keypress(e);
    };
    $this.keydown = function(e) {
        this._owner.keydown(e);
    };
    $this.keyup = function(e) {
        this._owner.keyup(e);
    };
    
    var initialize = function(options) {
        var self = this;
        var target, width, height;
        var container, tab, content, toolbar;
        
        options.forecolor   = options.forecolor   || "#333333";
        options.backcolor   = options.backcolor   || "#e0e0e0";
        options.bordercolor = options.bordercolor || "#999999";
        
        this.width  = options.width  = width  = options.width  || 300;
        this.height = options.height = height = options.height || 200;
        
        target = null;
        if (options.target) {
            if (options.target instanceof HTMLElement) {
                target = options.target;
            } else if (typeof(options.target) === "string") {
                target = document.getElementById(options.target);
            }
        }
        if (!target) target = document.body;
        
        this._elem = container = jQuery(document.createElement("div"))
            .width(width);
        
        // tab
        tab = initialize_tab.call(this, options);
        container.append(tab);
        
        // content
        content = initialize_content.call(this, options);
        container.append(content);
        
        // toolbar
        toolbar = initialize_toolbar.call(this, options);
        container.append(toolbar);

        this._mainTab.click();
        
        jQuery(target).append(container);
        
        
        // adjust tab location (???)
        (function(self) {
            var tabTop, tabHeight, tabBottomTop, adjust;
            tabTop    = self._sourceTab.offset().top;
            tabHeight = self._sourceTab.height();
            tabBottomTop = self._tabBottom.offset().top;
            adjust = (tabTop + tabHeight) - tabBottomTop + 11;
            self._tabBottom.css("margin-top", adjust + "px");
        }(this));

    };
    
    var initialize_tab = function(options) {
        var self = this;
        var container, tab;
        
        container = jQuery(document.createElement("div"))
            .width(options.width);
        
        tab = jQuery(document.createElement("ul"))
            .css("list-style", "none")
            .css("margin", "0px").css("padding", "0px")
            .width(options.width);
        
        this._tabTemplate = jQuery(document.createElement("li"))
            .css("display", "inline")
            .css("border", "solid 1px " + options.bordercolor)
            .css("background", "#efefef")
            .css("color", "#a0a0a0")
            .css("font", "bold 10px monospace")
            .css("margin", "0px 3px 0px 0px")
            .css("padding", "3px 15px")
            .css("margin", "5px 2px 0px 0px").css("padding", "5px 10px")
            .click(function() {
                if (! self._owner.runmode) {
                    if (self._currentTab) {
                        self._currentTab.css("background", "#efefef")
                            .css("color", "#a0a0a0")
                            .css("border-bottom-color", options.bordercolor);
                    }
                    self._currentTab = jQuery(this).css("background", options.backcolor)
                        .css("color", "#000000")
                        .css("border-bottom-color", options.backcolor);
                    self.selectTab(self._currentTab.attr("id"));
                }
            });
        
        this._mainTab = this._tabTemplate.clone(true)
            .attr("id", "__main__").text("Main");
        
        this._sourceTab = this._tabTemplate.clone(true)
            .attr("id", "__source__").text("Source");
        
        this._tabBottom = jQuery(document.createElement("div"))
            .css("background", options.backcolor)
            .css("border", "solid 1px " + options.bordercolor)
            // .css("margin-top", "4px")
            .width(options.width).height("5px");
        
        tab.append(this._mainTab);
        tab.append(this._sourceTab);
        
        container.append(tab).append(this._tabBottom);
        
        return container;
    };

    var initialize_content = function(options) {
        var container;
        
        container = jQuery(document.createElement("div"))
            .css("border", "solid 0px " + options.bordercolor)
            .css("border-width", "0px 1px 0px 1px")
            .width(options.width).height(options.height);
        
        this._canvas = new ENZCanvasView(this, options);
        this._source = new ENZSourceView(this, options);
        
        container.append(this._source.elem);
        container.append(this._canvas.elem);
        
        return container;
    };
    
    var initialize_toolbar = function(options) {
        var self = this;
        var container, credit;
        
        container = jQuery(document.createElement("div"))
            .css("color", options.forecolor).css("background", options.backcolor)
            .css("border", "solid 1px " + options.bordercolor)
            .css("height", "38px")
            .width(options.width);
        
        this._cursorPoint = jQuery(document.createElement("div")).text("0, 0");
        
        credit = jQuery(document.createElement("div"))
            .css("float", "right").css("font-size", "12px")
            .css("color", options.forecolor)
            .css("padding-right", "5px").css("text-align", "right")
            .append(this._cursorPoint)
            .append(jQuery(document.createElement("div")).text("enzui.js"));
        
        this._toolbar = new ENZPatchToolBar(this, options);
        container.append(credit);
        container.append(this._toolbar.elem);
        
        return container;
    };
    
    
    return ENZPatcherWindowView;
}());
enzui.gui.ENZPatcherWindowView = ENZPatcherWindowView;



var ENZSourceView = (function() {
    var ENZSourceView = function(window, options) {
        this._parent = window;
        this._elem   = null;
        this._visible = true;
        this._source  = "";
        
        initialize.call(this, options);
    }, $this = ENZSourceView.prototype;
        
    $this.__defineGetter__("elem", function() {
        return this._elem;
    });
    
    $this.__defineSetter__("source", function(value) {
        this._source = value;
        this._elem.val(value);
    });
    
    $this.__defineGetter__("source", function() {
        return this._source = this._elem.val();
    });
    
    $this.__defineGetter__("isChanged", function() {
        return this._source !== this._elem.val();
    });
    
    $this.__defineSetter__("visible", function(value) {
        if (value) {
            this._elem.show();
            this._visible = true;
        } else {
            this._elem.hide();
            this._visible = false;
        }
    });
    
    $this.__defineGetter__("visible", function() {
        return this._visible;
    });
    
    var initialize = function(options) {
        var self = this;
        
        this._elem = jQuery(document.createElement("textarea"))
            .css("font-size", "14px")
            .css("font-family", "'Courier New', monospace")
            .css("color", "black").css("background", "white")
            .css("border", "solid 0px transparent")
            .width(options.width).height(options.height);
    };
    
    return ENZSourceView;
}());


var ENZPatchToolBar = (function() {
    var ZoomRates = [0.25, 0.5, 0.8, 1.0, 1.25, 2.0, 2.5, 4.0];
    var ENZPatchToolBar = function(win, options) {
        this._parent = win;
        this._elem   = null;
        this._runButton   = null;
        this._toolBox     = null;
        this._moveButton  = null;
        this._gridButton  = null;
        this._cursorPoint = null;
        this._editToolBox = null;
        this._zoomIndex = (function() {
            for (var i = 0; i < ZoomRates.length; i++) {
                if (ZoomRates[i] === 1.0) return i;
            }
            return 0;
        }());
        initialize.call(this, options);
    }, $this = ENZPatchToolBar.prototype;
    
    $this.__defineGetter__("elem", function() {
        return this._elem;
    });
    
    $this.__defineSetter__("visible", function(value) {
        if (value) {
            this._elem.show();
        } else {
            this._elem.hide();
        }
    });

    $this.__defineSetter__("superlock", function(value) {
        if (value) {
            this._editToolBox.hide();
        } else {
            this._editToolBox.show();
        }
    });
    
    $this.__defineGetter__("superlock", function() {
        return this._parent.superlock;
    });
    
    $this.message = function(from, message) {
        switch (message) {
          case "run":
          case "stop":
            if (message === "run") {
                this._runButton.css("color", "red");
            } else {
                this._runButton.css("color", "black");
            }
            break;
          case "zoom+":
            if (this._zoomIndex < ZoomRates.length - 1) {
                this._zoomIndex += 1;
                this._parent.patchView.zoom = ZoomRates[this._zoomIndex];
            }
            break;
          case "zoom-":
            if (0 < this._zoomIndex) {
                this._zoomIndex -= 1;
                this._parent.patchView.zoom = ZoomRates[this._zoomIndex];
            }
            break;
          case "move":
            if (this._parent.patchView.toggleMoveMode()) {
                this._moveButton.css("color", "red");
            } else {
                this._moveButton.css("color", "black");
            }
            break;
          case "grid":
            if (this._parent.patchView.toggleGridMode()) {
                this._gridButton.css("color", "red");
            } else {
                this._gridButton.css("color", "black");
            }
            break;
          case "add":
            console.log("add object");
            break;
          case "remove":
            this._parent.patchView.removeSelectedObjects();
            break;
          case "dev":
            this._parent.patchView.devDump();
            break;
        }
    };
    
    var initialize = function(options) {
        var self = this;
        var width, height, forecolor, backcolor, bordercolor;
        var container, credit, button;
        var _toolBox, zoomOutButton, zoomUpButton, _moveButton, _gridButton;
        var _editToolBox, addButton, removeButton, devButton;
        
        forecolor   = options.forecolor;
        backcolor   = options.backcolor;
        bordercolor = options.bordercolor;
        width  = options.width;
        height = options.height;
        
        this._elem = container = jQuery(document.createElement("div"))
            .css("color", forecolor).css("background", backcolor)
            .css("border", "solid 0px transparent")
            .css("margin", "0px").css("padding", "0px")
            .width(width);
        
        this._toolBox = _toolBox = jQuery(document.createElement("div"))
            .css("display", "inline");
        this._editToolBox = _editToolBox = jQuery(document.createElement("div"))
            .css("display", "inline");
        
        button = jQuery(document.createElement("button"))
            .css("font-size", "10px")
            .css("padding", "0px")
            .css("margin", "2px 0px 2px 2px")
            .width(32).height(32)
            .click(function(e) {
                self.message("toolbar", jQuery(this).attr("message"));
            });
        
        this._runButton  = button.clone().text("RUN").attr("message", "run")
            .attr("title", "execute this program")
            .click(function(e) {
                self._parent.buttonClick("toolbar", jQuery(this).attr("message"));
            });
        
        zoomOutButton = button.clone(true).text("-")
            .attr("title", "zoom out").attr("message", "zoom-");
        zoomUpButton  = button.clone(true).text("+")
            .attr("title", "zoom in").attr("message", "zoom+");
        this._moveButton = _moveButton = button.clone(true).text("@")
            .attr("title", "move").attr("message", "move");
        //         this._gridButton = _gridButton = button.clone(true).text("#")
        //             .attr("title", "grid & snap").attr("message", "grid");
        _toolBox.append(zoomOutButton).append(zoomUpButton)
            .append(_moveButton);
        
        //         addButton = button.clone(true).text("a")
        //             .attr("title", "add new object").attr("message", "add");
        removeButton = button.clone(true).text("x")
            .attr("title", "remove selected objects").attr("message", "remove");
        //         devButton = button.clone(true).text("dev")
        //             .attr("title", "development~").attr("message", "dev");
        
        // _editToolBox.append(addButton).append(removeButton).append(devButton);
        _editToolBox.append(removeButton);
        
        container.append(this._runButton).append(this.lockButton)
            .append(_toolBox).append(_editToolBox);
    };
    
    return ENZPatchToolBar;
}());



var ENZCanvasView = (function() {
    var ENZCanvasView = function(windowView, options) {
        this._parent  = windowView;
        this._elem    = null;
        this._context = null;
        this._input   = null;
        this._inputLock = false;
        initialize.call(this, options);
    }, $this = ENZCanvasView.prototype;
    
    $this.__defineGetter__("elem", function() {
        return this._elem;
    });
    
    $this.__defineSetter__("visible", function(value) {
        if (value) {
            this._elem.show();
        } else {
            this._elem.hide();
        }
    });
    
    $this.__defineGetter__("context", function() {
        return this._context;
    });

    
    var initialize = function(options) {
        var self = this;
        var width, height, forecolor, backcolor, bordercolor;
        var canvas, context;

        forecolor   = options.forecolor;
        backcolor   = options.backcolor;
        bordercolor = options.bordercolor;
        width  = options.width;
        height = options.height;
        
        this._elem = jQuery(canvas = document.createElement("canvas"))
            .css("border", "solid 0px transparent")
            .css("margin", "0px").css("padding", "0px")
            .width(width).height(height);
        this.width  = canvas.width  = width;
        this.height = canvas.height = height;
        this._context = context = canvas.getContext("2d");
        
        canvas = this._elem;
        canvas.bind("contextmenu", function(e) {
            e.preventDefault();
        });
        
        // --- mouse event ---
        jQuery(document).mousemove(function(e) {
            var x, y, offset;
            if (! self._inputLock) {
                offset = canvas.offset();
                x = e.pageX - offset.left;
                y = e.pageY - offset.top;
                self._parent.patchView.mousemove(e, x, y);
                e.preventDefault();
            }
        });
        jQuery(canvas).mousedown(function(e) {
            var x, y, offset;
            if (! self._inputLock) {
                offset = canvas.offset();
                x = e.pageX - offset.left;
                y = e.pageY - offset.top;
                self._parent.patchView.mousedown(e, x, y);
                e.preventDefault();
            }
        });
        jQuery(document).mouseup(function(e) {
            var x, y, offset;
            if (! self._inputLock) {
                offset = canvas.offset();
                x = e.pageX - offset.left;
                y = e.pageY - offset.top;
                self._parent.patchView.mouseup(e, x, y);
            }
        });
        jQuery(canvas).click(function(e) {
            var x, y, offset;
            if (! self._inputLock) {
                offset = canvas.offset();
                x = e.pageX - offset.left;
                y = e.pageY - offset.top;
                self._parent.patchView.mouseclick(e, x, y);
                e.preventDefault();
            }
        });
        jQuery(canvas).dblclick(function(e) {
            var x, y, offset;
            if (! self._inputLock) {
                
                offset = canvas.offset();
                x = e.pageX - offset.left;
                y = e.pageY - offset.top;
                self._parent.patchView.mousedblclick(e, x, y);
                e.preventDefault();
            }
        });
        jQuery(canvas).mousemove(function(e) {
            self._parent.patchView.mousein(e);
            e.preventDefault();
        });
        jQuery(canvas).mouseout(function(e) {
            self._parent.patchView.mouseout(e);
            e.preventDefault();
        });

        // key event
        var keyRepeat = false;
        jQuery(window).keydown(function(e) {
            if (! self._inputLock) {
                if (!keyRepeat) {
                    self._parent.keydown(e);
                    keyRepeat = true;
                }
            }
        });
        jQuery(window).keyup(function(e) {
            if (! self._inputLock) {
                self._parent.keyup(e);
                keyRepeat = false;
            }
        });
        
        // input
        function inputCallback(value) {
            self._input.hide();
            self._parent._patchView.inputCallback(value);
            self._inputLock = false;
        }
        this._input = $(document.createElement("input"));
        this._input.css("position", "absolute")
                    .css("margin", "0px").css("padding", "0px")
                    .css("border-width", "0px").css("font-size", "11px").css("z-index", "100")
                    .change(function(e) { inputCallback($(this).val()); })
                    .blur(function(e)   { inputCallback($(this).val()); })
                    .hide();
        $(document.body).append(this._input);        
    };
    
    $this.showInput = function(value, x, y, width, height) {
        var offset, len;
        offset = this._elem.offset();
        len    = value ? value.length : 0;
        this._inputLock = true;
        x += offset.left;
        y += offset.top;
        this._input.val(value)
            .css("top", y+1).css("left", x+2)
            .css("width" , width  - 1)
            .css("height", height - 1)
            .show().focus().get(0).setSelectionRange(0, len);
    };
    
    return ENZCanvasView;
}());


var ENZCanvasPainter = (function() {
    var PI2 = Math.PI * 2;
    var ENZCanvasPainter = function(canvas) {
        this._context = canvas.context;
        this._width   = canvas.width;
        this._height  = canvas.height;
        this._x = 0;
        this._y = 0;
        this._range = {x1:0, y1:0, x2:0, y2:0};
        this._halfW  = this._width  / 2;
        this._halfH  = this._height / 2;
        this._subCanvas = document.createElement("canvas");
        this._subCanvas.width  = this._width;
        this._subCanvas.height = this._height;
        this._subContext = this._subCanvas.getContext("2d");
        this._subContext.textBaseline = "top";
        this._zoom = 1.0;
    }, $this = ENZCanvasPainter.prototype;

    
    $this.__defineSetter__("zoom", function(value) {
        if (value < 0.1) value = 0.1;
        else if (20.0 < value) value = 20.0;
        
        this._zoom = value;
        this._context.lineWidth = value;
        this._subContext.font = (10 * value) + "pt normal";
        
        this._range.x1 = -(this._halfW / this._zoom + this._x);
        this._range.x2 = +(this._halfW / this._zoom - this._x);
        this._range.y1 = -(this._halfH / this._zoom + this._y);
        this._range.y2 = +(this._halfH / this._zoom - this._y);
    });
    
    $this.__defineGetter__("zoom", function(value) {
        return this._zoom;
    });

    $this.__defineSetter__("point", function(value) {
        this._x = -value.x;
        this._y = -value.y;
        
        this._range.x1 = -(this._halfW / this._zoom + this._x);
        this._range.x2 = +(this._halfW / this._zoom - this._x);
        this._range.y1 = -(this._halfH / this._zoom + this._y);
        this._range.y2 = +(this._halfH / this._zoom - this._y);
    });
    $this.__defineGetter__("point", function() {
        return {x:-this._x, y:-this._y};
    });

    $this.__defineSetter__("lineWidth", function(value) {
        this._context.lineWidth = value;
    });

    $this.save = function() {
        this._context.save();
    };

    $this.restore = function() {
        this._context.restore();
    };
    
    
    $this.move = function(dx, dy) {
        this._x += dx / this._zoom;
        this._y += dy / this._zoom;
        this._range.x1 = -(this._halfW / this._zoom + this._x);
        this._range.x2 = +(this._halfW / this._zoom - this._x);
        this._range.y1 = -(this._halfH / this._zoom + this._y);
        this._range.y2 = +(this._halfH / this._zoom - this._y);
        return {x:this._x, y:this._y};
    };
    
    $this.convert = function(x, y) {
        x = ((x - this._halfW) / this._zoom) - this._x;
        y = ((y - this._halfH) / this._zoom) - this._y;
        return {x:x, y:y};
    };

    $this.reconvert = function(x, y) {
        x = this._zoom * (x + this._x) + this._halfW;
        y = this._zoom * (y + this._y) + this._halfH;
        return {x:x, y:y};
    };
    
    $this.begin = function() {
        this._context.save();
        this._context.clearRect(0, 0, this._width, this._height);
    };
    
    $this.end = function() {
        this._context.restore();
    };

    
    $this.drawtheline = function(x1, y1, x2, y2, color) {
        x1 = (x1 + this._x) * this._zoom + this._halfW;
        y1 = (y1 + this._y) * this._zoom + this._halfH;
        x2 = (x2 + this._x) * this._zoom + this._halfW;
        y2 = (y2 + this._y) * this._zoom + this._halfH;
        
        if (x2 < 0 || this._width < x1 || y2 < 0|| this._height < y1) {
            // out of the range
        } else {
            this._context.strokeStyle = color;
            this._context.beginPath();
            this._context.moveTo((x1|0)+0.5, (y1|0)+0.5);
            this._context.lineTo((x2|0)+0.5, (y2|0)+0.5);
            this._context.stroke();
        }
    };

    $this.bezierline = function(x1, y1, x2, y2, color) {
        var cp1x, cp1y, cp2x, cp2y;
        
        x1 = (x1 + this._x) * this._zoom + this._halfW;
        y1 = (y1 + this._y) * this._zoom + this._halfH;
        x2 = (x2 + this._x) * this._zoom + this._halfW;
        y2 = (y2 + this._y) * this._zoom + this._halfH;


//         if (x2 < 0 || this._width < x1 || y2 < 0|| this._height < y1) {
//             // out of the range
//         } else {
            this._context.strokeStyle = color;
            this._context.beginPath();
            this._context.moveTo((x1|0)+0.5, (y1|0)+0.5);
            
            if (x1 === x2 || y1 === y2) {
                this._context.lineTo((x2|0)+0.5, (y2|0)+0.5);
            } else {
                cp1x = x1;
                cp1y = y2; // (y1 + y2) / 2;
                cp2x = x2;
                cp2y = y1; // cp1y;
                
                this._context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, (x2|0)+0.5, (y2|0)+0.5);
            }
            this._context.stroke();
//         }
        
        
    };
    
    $this.rect = function(x, y, w, h, strokecolor, fillcolor) {
        var x1, y1, x2, y2;
        x1 = (x + this._x) * this._zoom + this._halfW;
        y1 = (y + this._y) * this._zoom + this._halfH;
        x2 = (x + w + this._x) * this._zoom + this._halfW;
        y2 = (y + h + this._y) * this._zoom + this._halfH;
        
        if (x2 < 0 || this._width < x1 || y2 < 0|| this._height < y1) {
            // out of the range
        } else {
            if (fillcolor) {
                this._context.fillStyle = fillcolor;
                this._context.fillRect((x1|0)+0.5, (y1|0)+0.5, (x2-x1|0), (y2-y1|0));
            }
            if (strokecolor) {
                this._context.strokeStyle = strokecolor;
                this._context.beginPath();
                this._context.rect((x1|0)+0.5, (y1|0)+0.5, (x2-x1|0), (y2-y1|0));
                this._context.stroke();
            }
        }
    };
    
    $this.measureText = function(text) {
        return this._subContext.measureText(text);
    };
    
    $this.text = function(text, x, y, w, h, color) {
        x = (x + this._x) * this._zoom + this._halfW;
        y = (y + this._y) * this._zoom + this._halfH;
        w = w * this._zoom;
        h = h * this._zoom;

        if (x+w < 0 || this._width < x || y+h < 0|| this._height < y) {
            // out of the range
        } else {
            this._subContext.clearRect(0, 0, w, h);
            this._subContext.fillStyle = color;
            this._subContext.fillText(text, 0, 0);
            if (this._width  < x + w) w = this._width  - x;
            if (this._height < y + h) h = this._height - y;
            try {
                this._context.drawImage(this._subCanvas, 0, 0, w, h, x, y, w, h);
            } catch (e) {
                
            }
        }
    };

    $this.textlines = function(lines, x, y, w, h, color) {
        var i, dh;
        
        x = (x + this._x) * this._zoom + this._halfW;
        y = (y + this._y) * this._zoom + this._halfH;
        w = w * this._zoom;
        h = h * this._zoom;

        if (x+w < 0 || this._width < x || y+h < 0|| this._height < y) {
            // out of the range
        } else {
            dh = 14;
            this._subContext.clearRect(0, 0, w, h);
            this._subContext.fillStyle = color;
            for (i = lines.length; i--; ) {
                this._subContext.fillText(lines[i], 0, i*dh);
            }
            if (this._width  < x + w) w = this._width  - x;
            if (this._height < y + h) h = this._height - y;
            try {
                this._context.drawImage(this._subCanvas, 0, 0, w, h, x, y, w, h);
            } catch (e) {
                
            }
        }
    };
    
    $this.arc = function(x, y, r, strokecolor, fillcolor) {
        r *= this._zoom;
        x = (x + this._x) * this._zoom + this._halfW;
        y = (y + this._y) * this._zoom + this._halfH;

        if (-r <= x && this._width + r && -r <= y && this._height + r) {
            this._context.beginPath();
            this._context.arc(x, y, r, 0, PI2, true);
            if (fillcolor) {
                this._context.fillStyle = fillcolor;
                this._context.fill();
            }
            if (strokecolor) {
                this._context.strokeStyle = strokecolor;
                this._context.stroke();
            }
        }
    };
    
    $this.path = function(path, color, lineWidth, fillcolor) {
        var _zoom, _halfW, _halfH, _x, _y;
        var x1, y1;
        var _context, i, imax;

        _zoom  = this._zoom;
        _halfW = this._halfW;
        _halfH = this._halfH;
        _x = this._x;
        _y = this._y;
        
        _context = this._context;
        
        if (path.length > 0) {
            _context.save();
            if (! lineWidth) lineWidth = 1;
            _context.lineWidth = lineWidth * _zoom;
            _context.strokeStyle = color;
            _context.beginPath();
            x1 = (path[0] + _x) * _zoom + _halfW;
            y1 = (path[1] + _y) * _zoom + _halfH;
            _context.moveTo((x1|0)+0.5, (y1|0)+0.5);
            for (i = 2, imax = path.length; i < imax; i += 2) {
                x1 = (path[i+0] + _x) * _zoom + _halfW;
                y1 = (path[i+1] + _y) * _zoom + _halfH;
                _context.lineTo((x1|0)+0.5, (y1|0)+0.5);
            }
            if (fillcolor) {
                _context.closePath();
                _context.stroke();
                _context.fillStyle = fillcolor;
                _context.fill();
            } else {
                _context.stroke();
            }
            _context.restore();
        }
    };
    
    $this.drawImage = function() {
        var image, sx, sy, sw, sh, dx, dy, dw, dh;
        var x1, x2, y1, y2;
        if (arguments.length === 3) {
            image = arguments[0];
            sx = 0;
            sy = 0;
            sw = image.width;
            sh = image.height;
            dx = arguments[1];
            dy = arguments[2];
            dw = image.width;
            dh = image.height;
        } else if (arguments.length === 5) {
            image = arguments[0];
            sx = 0;
            sy = 0;
            sw = image.width;
            sh = image.height;
            dx = arguments[1];
            dy = arguments[2];
            dw = arguments[3];
            dh = arguments[4];
        } else if (arguments.length === 9) {
            image = arguments[0];
            sx = arguments[1];
            sy = arguments[2];
            sw = arguments[3];
            sh = arguments[4];
            dx = arguments[5];
            dy = arguments[6];
            dw = arguments[7];
            dh = arguments[8];
        } else {
            image = arguments[0];
            sx = dx = 0;
            sy = dy = 0;
            sw = dw = image.width;
            sh = dh = image.height;
        }
        
        x1 = (dx + this._x) * this._zoom + this._halfW;
        y1 = (dy + this._y) * this._zoom + this._halfH;
        x2 = (dx + dw + this._x) * this._zoom + this._halfW;
        y2 = (dy + dh + this._y) * this._zoom + this._halfH;
        
        this._context.drawImage(image, sx, sy, sw, sh, x1, y1, x2-x1, y2-y1);
    };
    
    
    $this.grid = function(size, color) {
        var _context, _width, _height, _range, _zoom;
        var x, y, dx, dy;
        var from, to, i;
        
        _context = this._context;
        _width   = this._width;
        _height  = this._height;
        _range   = this._range;
        _zoom    = this._zoom;
        
        _context.save();
        _context.lineWidth = 1;
        
        _context.strokeStyle = color;
        _context.beginPath();
        
        from = ((_range.x1 / size)|0) * size;
        to   = ((_range.x2   / size)|0) * size;
        x    = (from + this._x) * _zoom + this._halfW;
        dx   = size * _zoom;
        for (i = from; i <= to; i+= size) {
            _context.moveTo((x|0)+0.5, 0);
            _context.lineTo((x|0)+0.5, _height);
            x += dx;
        }
        
        from = ((_range.y1 / size)|0) * size;
        to   = ((_range.y2   / size)|0) * size;
        y    = (from + this._y) * _zoom + this._halfH;
        dy   = size * _zoom;
        for (i = from; i <= to; i+= size) {
            _context.moveTo(0     , (y|0)+0.5);
            _context.lineTo(_width, (y|0)+0.5);
            y += dy;
        }
        
        _context.stroke();
        _context.restore();
    };
    
    return ENZCanvasPainter;
}());


var ENZPatchView = (function() {
    var EDIT = 0;
    var PLAY = 1;
    
    var NONE = 0;
    var RECT = 1;
    var MOVE = 2;
    var CONN = 3;

    var SelectRectangle = function() {
        this.x1 = this.y1 = this.x2 = this.y2 = 0;
    };
    SelectRectangle.prototype = {
        set: function(x, y) {
            this.x1 = this.x2 = x;
            this.y1 = this.y2 = y;
        },
        update: function(x, y) {
            this.x2 = x;
            this.y2 = y;
        },
        get: function() {
            var x1, x2, y1, y2;
            if (this.x1 < this.x2) {
                x1 = this.x1; x2 = this.x2;
            } else {
                x1 = this.x2; x2 = this.x1;
            }
            if (this.y1 < this.y2) {
                y1 = this.y1; y2 = this.y2;
            } else {
                y1 = this.y2; y2 = this.y1;
            }
            return [x1, y1, x2, y2];
        }
    };
    
    var ENZPatchView = function(owner) {
        var self = this;
        
        this._owner = owner;
        this._windowView = owner.window.view;
        this._canvasPainter = new ENZCanvasPainter(this._windowView.canvas);
        this._mouse = {on:false, out:true, x:0, y:0, gx:0, gy:0, sx:0, sy:0, mode:NONE};
        this._canvasMoveMode   = false;
        this._objectResizeMode = false;
        this._superlock  = false;
        this._selectRect = new SelectRectangle();
        this._targetObjects = [];
        this._overObject1 = null;
        this._overObject2 = null;
        this._editObject  = null;
        this._viewOptions = { gridsize:10, snapsize:10, zoom:1.0 };
        
        this._aniObjects = [];
    }, $this = ENZPatchView.prototype;
    
    $this.__defineGetter__("name", function() {
        return this._owner.name;
    });
    
    $this.__defineSetter__("superlock", function(value) {
        this._superlock = value;
    });
    
    $this.__defineGetter__("superlock", function() {
        return this._superlock;
    });

    $this.__defineGetter__("width", function() {
        return this._windowView.width;
    });
    
    $this.__defineGetter__("height", function() {
        return this._windowView.height;
    });
    
    $this.__defineSetter__("zoom", function(value) {
        this._canvasPainter.zoom = value;
        this._viewOptions.zoom = this._canvasPainter.zoom;
        this.draw();
    });
    
    $this.__defineGetter__("zoom", function() {
        return this._canvasPainter.zoom;
    });

    $this.__defineSetter__("point", function(pos) {
        this._canvasPainter.point = pos;
        this.draw();
    });
    
    $this.__defineGetter__("point", function() {
        return this._canvasPainter.point;
    });
    
    $this.toggleMoveMode = function() {
        return this._canvasMoveMode = !this._canvasMoveMode;
    };
    
    $this.toggleGridMode = function() {
        //         var result = this.gridmode = !this.gridmode;
        //         if (result) {
        //             this._viewOptions.gridsize = this._viewOptions.snapsize = 10;
        //         } else {
        //             this._viewOptions.gridsize = this._viewOptions.snapsize =  0;
        //         }
        this.draw();
        return result;
    };
    
    $this.devDump = function() {
        console.log( "e=" + this._owner.allEdges.length );
        console.log( "s=" + this._owner.allSegments.length );

    };

    $this.removeSelectedObjects = function() {
        var list, i;
        list = this._targetObjects;
        for (i = list.length; i--; ) {
            list[i].destroy();
        }
        this.draw();
    };
    
    
    var drawPatchNode = (function() {
        var exec = function(painter, x, y, w, h, type) {
            var list, color;
            var selectedIndex, selectedType, i;
            list = this.patchNodes[type];

            selectedType  = this.selected.type;
            selectedIndex = this.selected.index;
            
            for (i = list.length; i--; ) {
                if (selectedIndex === i && selectedType === type) {
                    color = "red";
                } else if (list[i].msp) {
                    color = "darkorange";
                } else {
                    color = "dimgray";
                }
                painter.arc(x + list[i].x, y + list[i].y, 3, null, color);
            }
        };
        
        return function(painter) {
            exec.call(this, painter, this.x, this.y, this.width, this.height, INLET );
            exec.call(this, painter, this.x, this.y, this.width, this.height, OUTLET);
        };
    }());
    
    $this.measureText = function(text) {
        return this._canvasPainter.measureText(text);
    };
    
    $this.draw = function() {
        var painter;
        var objects, edges, segments;
        var editmode;
        var list, x1, y1, x2, y2, offset, pos;
        var color, o, s, i;
        
        painter = this._canvasPainter;
        
        objects  = this._owner.objects;
        editmode = !this._owner.runmode;
        
        painter.begin();
        
        // draw grid
        // if (this._viewOptions.gridsize) {
        if (editmode) {
            painter.grid(this._viewOptions.gridsize, "paleturquoise");
        }
        
        // draw edges
        edges = this._owner.allEdges;
        for (i = edges.length; i--; ) {
            edges[i].draw(painter);
        }
        
        // draw segments
        /*
        if (editmode) {
            segments = this._owner.allSegments;
            for (i = segments.length - 1; i >= 0; i--) {
                o = segments[i];
                if (o.edge.outlet.msp) {
                    color = o.selected ? "red" : "darkorange";
                } else {
                    color = o.selected ? "red" : "gray";
                }
                painter.arc(o.x, o.y, 3, null, color);
            }
        }
        */
        
        // draw objects
        for (i = objects.length; i--; ) {
            o = objects[i];
            o.draw(painter);
            if (editmode) {
                drawPatchNode.call(o, painter);
            }
        }
        
        // selecting
        if (this._mouse.mode === RECT) {
            list = this._selectRect.get();
            x1 = list[0]; y1 = list[1]; x2 = list[2]; y2 = list[3];
            painter.rect(x1, y1, x2 - x1, y2 - y1, null, "rgba(224, 224, 224, 0.5)");
        }
        
        // patching
        if (this._mouse.mode === CONN) {
            o = this._targetObjects[0];
            s = o.selected;
            x1 = o.x + o.patchNodes[s.type][s.index].x;
            y1 = o.y + o.patchNodes[s.type][s.index].y;
            painter.drawtheline(x1, y1, this._mouse.gx, this._mouse.gy, "red");
        }
        
        painter.end();
    };
    
    $this.animate = function() {
        this._aniObjects = this._owner.aniObjects;
        this.onanimate();
    };
    
    $this.onanimate = function() {
        var self = this;
        var painter;
        var objects, i;

        painter = this._canvasPainter;
        objects = this._aniObjects;
        
        for (i = objects.length; i--; ) {
            objects[i].onanimate(painter);
        }
        
        if (this._owner.runmode) {
            requestAnimationFrame(function() {
                self.onanimate();
            });
        } else {
            self.draw();
        }
    };
    
    
    $this.mouseclick = function(e, x, y) {
        
    };
    
    $this.inputCallback = function(value) {
        if (this._editObject !== null) {
            this._editObject.reborn(value);
            this.draw();
        }
        this._editObject = null;
    };
    
    $this.mousedblclick = function(e, x, y) {
        var pos, o;
        var snapsize;
        var ox, oy, ow, oh;
        pos = this._canvasPainter.convert(x, y);
        
        if (!this._owner.runmode) { // TODO: rumnode input
            
            if (!this._owner.runmode) {
                if (this._targetObjects.length === 0) {

                    snapsize = this._viewOptions.snapsize;

                    ox = ((pos.x / snapsize)|0) * snapsize;
                    oy = ((pos.y / snapsize)|0) * snapsize;
                    
                    o = this._owner.addObject("object", {x:ox, y:oy});
                } else {
                    o = this._targetObjects[0];
                }
            } else {
                o = this._targetObjects[0];
                console.log(o);
            }
            
            if (o instanceof enzui.core.ENZObjectBox) {
                this.unselectAllObjects();
                this._targetObjects = [ o ];
                o.selected.selected = true;
                this._editObject = o;
                
                pos = this._canvasPainter.reconvert(o.x, o.y);
                ox = pos.x;
                oy = pos.y;
                ow = o.width  * this.zoom;
                oh = o.height * this.zoom;
                this._windowView.canvas.showInput(o.objectbody.command, ox, oy, ow, oh);
            }
        }
    };
    
    $this.mousemove = function(e, x, y) {
        var pos, dx, dy;
        pos = this._canvasPainter.convert(x, y);
        
        if (this._canvasMoveMode && this._mouse.on) {
            dx = e.pageX - this._mouse.x;
            dy = e.pageY - this._mouse.y;
            this._canvasPainter.move(dx, dy);
            this._mouse.x = e.pageX;
            this._mouse.y = e.pageY;
            this.draw();
        } else if (!this._owner.runmode) {
            // unlock (edit)
            if (! this._superlock) {
                mousemoveFunction[EDIT][this._mouse.mode].call(this, e, pos);
                this._mouse.x = e.pageX;
                this._mouse.y = e.pageY;
                this._mouse.gx = pos.x;
                this._mouse.gy = pos.y;
                this.draw();
            }
        } else {
            // lock (run)
            mousemoveFunction[PLAY].call(this, e, pos);
        }
        
        if (! this._mouse.out) {
            this._windowView.setCursorPoint(pos);
        }
    };
    
    $this.mousedown = function(e, x, y) {
        var pos;
        this._mouse.on = true;
        this._mouse.x = e.pageX;
        this._mouse.y = e.pageY;
        
        if (this._mouse.out) return;
        
        if (this._canvasMoveMode && this._mouse.on) {
            
        } else  if (!this._owner.runmode) {
            // unlock (edit)
            if (! this._superlock) {
                pos = this._canvasPainter.convert(x, y);
                mousedownFunction[EDIT][this._mouse.mode].call(this, e, pos);
                this._mouse.gx = pos.x;
                this._mouse.gy = pos.y;
                this.draw();
            }
        } else {
            // lock (run)
            pos = this._canvasPainter.convert(x, y);
            mousedownFunction[PLAY].call(this, e, pos);
        }
    };
    
    $this.mouseup = function(e, x, y) {
        var pos;
        this._mouse.on = false;
        if (this._mouse.out) return;

        if (this._canvasMoveMode && this._mouse.on) {
            
        } else if (!this._owner.runmode) {
            // unlock (edit)
            if (! this._superlock) {
                pos = this._canvasPainter.convert(x, y);
                mouseupFunction[EDIT][this._mouse.mode].call(this, e, pos);
                this.draw();
            }
        } else {
            // lock (run)
            pos = this._canvasPainter.convert(x, y);
            mouseupFunction[PLAY].call(this, e, pos);
        }
    };
    
    $this.mousein = function(e) {
        this._mouse.out = false;
    };
    
    $this.mouseout = function(e) {
        this._mouse.out = true;
    };
    
    
    // mouse operation
    var mousemoveFunction = [ [], NOP ];
    var mousedownFunction = [ [], NOP ];
    var mouseupFunction   = [ [], NOP ];
    var NOP = function() {};

    mousemoveFunction[EDIT] = [ NOP, NOP, NOP, NOP ];
    mousedownFunction[EDIT] = [ NOP, NOP, NOP, NOP ];
    mouseupFunction  [EDIT] = [ NOP, NOP, NOP, NOP ];

    
    mousedownFunction[PLAY] = function(e, pos) {
        var o;
        if (!!(o = this._owner.findObjectWithXY(pos))) {
            if (o.objectbody.GUI) {
                if (this._targetObjects.length > 0) {
                    this._targetObjects[0].selected.selected = false;
                }
                this._targetObjects = [o];
                o.selected.selected = true;
                o.objectbody.onmousedown(pos.x, pos.y);
            } else {
                if (this._targetObjects.length > 0) {
                    this._targetObjects[0].selected.selected = false;
                }
                this._targetObjects = [];
            }
        } else if (e.metaKey || e.ctrlKey) {
            this._owner.window.stop();
        } else {
            if (this._targetObjects.length > 0) {
                this._targetObjects[0].selected.selected = false;
            }
        }
    };
    mousemoveFunction[PLAY] = function(e, pos) {
        var t, dx, dy;
        if (this._mouse.on) {
            t = this._targetObjects[0];
            if (t && t.objectbody.GUI) {
                dx = e.pageX - this._mouse.x;
                dy = e.pageY - this._mouse.y;
                t.objectbody.onmousemove(pos.x, pos.y, dx, dy);
            }
            this._mouse.x = e.pageX;
            this._mouse.y = e.pageY;
        }
    };
    mouseupFunction[PLAY] = function(e, pos) {
        var t, o;
        t = this._targetObjects[0];
        if (t && t.objectbody.GUI) {
            o = this._owner.findObjectWithXY(pos);
            if (t === o) {
                t.objectbody.onmouseup(pos.x, pos.y);
            }
        }
    };
    
    mousemoveFunction[EDIT][NONE] = function(e, pos) {
        var o;
        if (!!(o = this._owner.findObjectWithXY(pos))) {
            o.selectPatchNode(pos.x - o.x, pos.y - o.y, this._viewOptions);
            this._overObject1 = o;
            this._windowView.setCursorStyle("pointer");
        } else if (this._overObject1) {
            this._overObject1.selectPatchNode(null, null);
            this._overObject1 = null;
            this._windowView.setCursorStyle("default");
        }
    };
    
    mousedownFunction[EDIT][NONE] = function(e, pos) {
        var o, i;
        if (!!(o = this._overObject1)) {
            if (!o.selected.selected) {
                if (e.shiftKey) {
                    o.selected.selected = true;
                } else {
                    this.unselectAllObjects();
                    o.selected.selected = true;
                }
            } else {
                i = this._targetObjects.indexOf(o);
                this._targetObjects.splice(i, 1);
            }
            this._targetObjects.unshift(o);
            
            if ((o instanceof enzui.core.ENZObjectBox) && o.selected.index !== -1) {
                this._mouse.mode = CONN;
            } else {
                this._objectResizeMode = (o.width - 7 <= pos.x - o.x);
                this._mouse.sx = pos.x;
                this._mouse.sy = pos.y;
                this._mouse.mode = MOVE;
            }
        } else if (!!(o = this._owner.findEdgeWithXY(pos, this._viewOptions))) {
            if (!o.selected.selected) {
                if (e.shiftKey) {
                    o.selected = true;
                } else {
                    this.unselectAllObjects();
                    o.selected = true;
                }
            } else {
                i = this._targetObjects.indexOf(o);
            } 
            this._targetObjects.unshift(o);
            this._mouse.sx = pos.x;
            this._mouse.sy = pos.y;
            this._mouse.mode = MOVE;
        } else if (e.metaKey || e.ctrlKey) {
            this._owner.window.run();
        } else {
            this.unselectAllObjects();
            this._mouse.mode = RECT;
            this._selectRect.set(pos.x, pos.y);
        }
    };
    
    mousemoveFunction[EDIT][RECT] = function(e, pos) {
        var x, y, x1, y1, x2, y2;
        var list, o, i;
        
        this._selectRect.update(pos.x, pos.y);
        list = this._selectRect.get();
        x1 = list[0]; y1 = list[1]; x2 = list[2]; y2 = list[3];
        list = this._owner.objects;
        for (i = list.length; i--; ) {
            o = list[i];
            o.selected.selected = !(o.x + o.width  < x1 || x2 < o.x ||
                                    o.y + o.height < y1 || y2 < o.y);
        }
        
        list = this._owner.allSegments;
        for (i = list.length; i--; ) {
            x = list[i].x;
            y = list[i].y;
            list[i].selected = !(x < x1 || x2 < x || y < y1 || y2 < y);
        }
    };
    
    mouseupFunction[EDIT][RECT] = function(e, pos) {
        var list, _targetObjects, i;
        this._mouse.mode = NONE;
        _targetObjects = this._targetObjects = [];
        list = this._owner.objects;
        for (i = list.length; i--; ) {
            if (list[i].selected.selected) _targetObjects.push(list[i]);
        }
        
        list = this._owner.allSegments;
        for (i = list.length; i--; ) {
            if (list[i].selected) {
                _targetObjects.push(list[i]);
            }
        }
    };
    
    mousemoveFunction[EDIT][MOVE] = function(e, pos) {
        var dx, dy, t;
        var snapsize, x1, x2, ddx;
        var _viewOptions;
        var list, i;

        _viewOptions = this._viewOptions;

        dx = (pos.x - this._mouse.sx) / _viewOptions.zoom;
        dy = (pos.y - this._mouse.sy) / _viewOptions.zoom;
        
        snapsize = _viewOptions.snapsize;
        if (snapsize <= Math.abs(dx)) {
            dx = snapsize * ((dx < 0) ? -1 : +1);
            this._mouse.sx = pos.x;
        } else {
            dx = 0;
        }
        
        if (snapsize <= Math.abs(dy)) {
            dy = snapsize * ((dy < 0) ? -1 : +1);
            this._mouse.sy = pos.y;
        } else {
            dy = 0;
        }
        
        list = this._targetObjects;
        if (this._objectResizeMode) {
            for (i = list.length; i--; ) {
                list[i].resize(pos.x, pos.y, dx, dy);
            }
        } else {
            for (i = list.length; i--; ) {
                list[i].move(pos.x, pos.y, dx, dy);    
            }
        }
    };
    
    mouseupFunction[EDIT][MOVE] = function(e, pos) {
        this._mouse.mode = NONE;
    };
    
    mousemoveFunction[EDIT][CONN] = function(e, pos) {
        var o;
        if (!!(o = this._owner.findObjectWithXY(pos))) {
            if (o !== this._overObject1) {
                o.selectPatchNode(pos.x - o.x, pos.y - o.y);
                if (o.selected.type !== this._overObject1.selected.type) {
                    this._overObject2 = o;
                } else {
                    o.selectPatchNode(null, null);
                }
            }
        } else if (this._overObject2) {
            this._overObject2.selectPatchNode(null, null);
            this._overObject2 = null;
        }
    };

    mouseupFunction[EDIT][CONN] = function(e, pos) {
        var scp1, scp2, n1, n2;
        
        if (this._overObject1 && this._overObject2) {
            scp1 = this._overObject1.selected;
            scp2 = this._overObject2.selected;
            n1 = this._overObject1.patchNodes[scp1.type][scp1.index];
            n2 = this._overObject2.patchNodes[scp2.type][scp2.index];
            if (n1 && n2) {
                this._owner.addPatchEdge(n1, n2);
            }
        }
        if (this._overObject2) {
            this._overObject2.selectPatchNode(null, null);
            this._overObject2 = null;
        }
        
        if (! e.shiftKey) {
            if (this._overObject1) {
                this._overObject1.selectPatchNode(null, null);
                this._overObject1 = null;
            }
            this._mouse.mode = NONE;    
            this._windowView.setCursorStyle("default");
        } else {
            this._windowView.setCursorStyle("pointer");
        }
    };
    
    mousedownFunction[EDIT][CONN] = mouseupFunction[EDIT][CONN];
    
    
    $this.unselectAllObjects = function() {
        var list, i;
        list = this._owner.objects;
        for (i = list.length; i--; ) {
            list[i].selected.selected = false;
        }
        
        list = this._owner.allEdges;
        for (i = list.length; i--; ) {
            list[i].selected = false;
            list[i].segmentIndex = -1;
        }

        list = this._owner.allSegments;
        for (i = list.length; i--; ) {
            list[i].selected = false;
        }
        this._targetObjects = [];
    };
    
    return ENZPatchView;
}());
enzui.gui.ENZPatchView = ENZPatchView;




    

var ENZObjectChange = (function() {
    var ENZObjectChange = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectChange.prototype;

    $this.inlets  = 1;
    $this.outlets = 3;

    $this.initialize = function() {
        
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
            if (this.args[1] === "-") {
                this.defaults.mode = -1;
            }
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }

        if (isNaN(this.defaults.moden)) {
            this.defaults.mode = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
        this._mode     = this.defaults.mode;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var ch;
        if (this._curValue !== value.value) {
            if (this._curValue !== 0 && value.value === 0) {
                this.send(2, {type:BANG}, event, count);
            }
            if (this._curValue === 0 && value.value !== 0) {
                this.send(1, {type:BANG}, event, count);
            }
            if (this._mode === -1) {
                ch = this._curValue < value.value;
            } else if (this._mode === +1) {
                ch = this._curValue > value.value;
            } else {
                ch = true;
            }
            
            if (ch) {
                this._curValue = value.value|0;
                this.send(0, {type:NUMBER, value:this._curValue}, event, count);
            }
        }
    };
    
    $this.$set = function(inlet, value, event, count) {
        this._curValue = value.value|0;
    };

    $this.$mode = function(inlet, value, event, count) {
        if (value.value === "-") {
            this._mode = -1;
        } else if (value.value === "+") {
            this._mode = +1;
        }
    };
    
    return ENZObjectChange;
}());
enzui({klassName:"change", klass:ENZObjectChange,
       whatis:"Filter out repetitions of a number",
       category:"enzui.control"});


var ENZObjectCounter = (function() {
    var ENZObjectCounter = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCounter.prototype;
    
    $this.inlets  = 5;
    $this.outlets = 4;
    
    $this.initialize = function() {
        if (this.args.length === 1) {
            this.defaults.max = this.args[0]|0;
        } else if (this.args.length === 2) {
            this.defaults.min = this.args[0]|0;
            this.defaults.max = this.args[1]|0;
        } else if (this.args.length >= 3) {
            this.defaults.min = this.args[1]|0;
            this.defaults.max = this.args[2]|0;
            if (this.args[0] === "1") {
                this.defaults.sign = -1;
            } else if (this.args[0] === "2") {
                this.defaults.updown = true;
            }
        }
        
        if (!this.defaults.updown) {
            this.defaults.updown = false;
        }

        if (isNaN(this.defaults.min)) {
            this.defaults.min = 0;
        }
        if (isNaN(this.defaults.max)) {
            this.defaults.max = Infinity;
        }
        if (isNaN(this.defaults.sign)) {
            this.defaults.sign = +1;
        }
    };
    
    $this.onstart = function() {
        this._minValue = this.defaults.min;
        this._maxValue = this.defaults.max;
        this._sign     = this.defaults.sign;
        this._updown   = this.defaults.updown;
        this._carrybang  = false;
        this._maxCounter = 0;

        if (this._sign === -1) {
            this._curValue = this._maxValue;
        } else {
            this._curValue = this._minValue;
        }
    };
    
    var doCount = function(inlet, value, event, count) {
        var val;

        if (this._curValue > this._maxValue) {
            if (this._updown) {
                this._sign = -1;
                this._curValue = this._maxValue - 1;
            } else {
                this._curValue = this._minValue;
            }
        } else if (this._curValue < this._minValue) {
            if (this._updown) {
                this._sign = +1;
                this._curValue = this._minValue + 1;
            } else {
                
                this._curValue = this._maxValue;
            }
        }
        
        if (this._curValue === this._maxValue) {
            this._maxCounter += 1;
            this.send(3, {type:NUMBER, value:this._maxCounter}, event, count);
        }
        
        if (! this._carrybang) {
            val = (this._curValue === this._maxValue) ? 1 : 0;
            this.send(2, {type:NUMBER, value:val}, event, count);
            val = (this._curValue === this._minValue) ? 1 : 0;
            this.send(1, {type:NUMBER, value:val}, event, count);
        } else {
            if (this._sign === +1 && this._curValue === this._maxValue) {
                this.send(2, {type:BANG}, event, count);
            }
            if (this._sign === -1 && this._curValue === this._minValue) {
                this.send(1, {type:BANG}, event, count);
            }
        }
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        this._curValue += this._sign;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        var val;
        switch (inlet) {
          case 0:
            doCount.apply(this, arguments);
            break;
          case 1:
            this._sign *= -1;
            break;
          case 2:
            this._curValue = this._minValue;
            break;
          case 3:
            this._curValue = this._minValue;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
            break;
          case 4:
            this._curValue = this._maxValue;
            break;
        }
    };

    $this.$number = function(inlet, value, event, count) {
        var val = value.value|0;
        switch (inlet) {
          case 0:
            doCount.apply(this, arguments);
            break;
          case 1:
            if (val === 1) {
                this._sign = -1;
                this._updown = false;
            } else if (val === 2) {
                this._updown = true;
            } else {
                this._sign = +1;
                this._updown = false;
            }
            break;
          case 2:
            this._curValue = val;
            if (val < this._minValue) {
                this._minValue = val;
            } else if (this._maxValue < val) {
                this._minValue = this._maxValue = val;
            }
            break;
          case 3:
            this._curValue = val;
            if (val < this._minValue) {
                this._minValue = val;
            } else if (this._maxValue < val) {
                this._minValue = this._maxValue = val;
            }
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
            break;
          case 4:
            if (val < this._minValue) {
                this._minValue = this._minValue + 1;
            } else {
                this._maxValue = val;
            }
            break;
        }
    };

    $this.$set = $this.$goto = function(inlet, value, event, count) {
        var val = value.value|0;
        if (inlet === 0) {
            this._curValue = val;
        }
    };
    
    $this.$jam = function(inlet, value, event, count) {
        var val = value.value|0;
        if (inlet === 0) {
            this._curValue = val;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };

    $this.$up = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = this._minValue;
            this._sign = +1;
            this._updown = false;
        }
    };

    $this.$down = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = this._maxValue;
            this._sign = -1;
            this._updown = false;
        }
    };

    $this.$updown = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = this._minValue;
            this._sign = +1;
            this._updown = true;
        }
    };
    
    $this.$inc = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue += 1;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };    

    $this.$dec = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue -= 1;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };    

    $this.$next = function(inlet, value, event, count) {
        if (inlet === 0) {
            $this.bang.apply(this, arguments);
        }
    };
    
    $this.$min = function(inlet, value, event, count) {
        var val = value.value|0;
        if (inlet === 0) {
            if (this._maxValue < val) {
                this._minValue = this._maxValue;
            } else {
                this._minValue = val;
            }
        }
    };

    $this.$max = function(inlet, value, event, count) {
        var val = value.value|0;
        if (inlet === 0) {
            if (val < this._mixValue) {
                this._maxValue = this._minValue + 1;
            } else {
                this._maxValue = val;
            }
        }
    };

    $this.$carrybang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._carrybang = true;
            console.log("carrybang");
        }
    };    
    
    $this.$carryint = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._carrybang = false;
        }
    };    
    
    return ENZObjectCounter;
}());
enzui({klassName:"counter", klass:ENZObjectCounter,
       whatis:"Count the bang messages received, output the count",
       category:"enzui.control"});


var ENZObjectForward = (function() {
    var ENZObjectForward = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectForward.prototype;

    $this.inlets = 1;

    $this.initialize = function() {
        this.defaults.name = this.args[0] || "";
    };
    
    $this.onstart = function() {
        this.name = this.defaults.name;
        this._buddies  = this.objectbox.getReceiveObjects(this.name);
        this._curValue = {type:NUMBER, value:0};
    };
    
    $this.$send = function(inlet, value, event, count) {
        this.name = value.value;
        this._buddies  = this.objectbox.getReceiveObjects(this.name);
    };
    
    var f = function(inlet, value, event, count) {
        var i, _buddies, _curValue;
        _buddies  = this._buddies;
        _curValue = this._curValue = value;
        for (i = _buddies.length; i--; ) {
            _buddies[i].send(0, _curValue, event, count);
        }
    };
    $this.$bang = $this.$number = $this.$string = $this.$list = f;
    
    return ENZObjectForward;
}());
enzui({klassName:"forward", klass:ENZObjectForward,
       whatis:"Send remote messages to a variety of objects",
       category:"enzui.control"});


var ENZObjectGate = (function() {
    var ENZObjectGate = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectGate.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;
    
    $this.initialize = function() {
        var n;

        if (!isNaN(this.args[0])) {
            n = this.args[0]|0;
            if (n < 1) n = 1;
        } else {
            n = 1;
        }
        this.outlets = n;
        
        if (!isNaN(this.args[1])) {
            this.defaults.gate = this.args[1]|0;
        }
        if (isNaN(this.defaults.gate)) {
            this.defaults.gate = 0;
        }
    };

    $this.onstart = function() {
        this._gate = this.defaults.gate;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var v;
        if (inlet === 0) {
            v = value.value|0;
            if (0 <= v && v <= this.outlets) {
                this._gate = v;
            }
        } else {
            if (this._gate) {
                this.send(this._gate-1, value, event, count);
            }
        }
    };
    
    var f = function(inlet, value, event, count) {
        if (this._gate) {
            this.send(this._gate-1, value, event, count);
        }
    };
    $this.$bang = $this.$list = $this.$string = f;
    
    return ENZObjectGate;
}());
enzui({klassName:"gate", klass:ENZObjectGate,
       whatis:"Pass the input out a specific outlet",
       category:"enzui.control"});


var ENZObjectMaximum = (function() {
    var ENZObjectMaximum = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectMaximum.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };

    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (this._curValue < value.value) {
                this._curValue = value.value;
            }
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._curValue = value.value;
        }
    };

    var sortF = function(a, b) {return b-a;};

    $this.$list = function(inlet, value, event, count) {
        var list;
        if (inlet === 0) {
            list = value.value.sort(sortF);
            this._curValue = list[1];
            this.send(0, {type:NUMBER, value:list[0]}, event, count);
        }
    };
    
    return ENZObjectMaximum;
}());
enzui({klassName:"maximum", klass:ENZObjectMaximum,
       whatis:"Output the greatest in a list of numbers",
       category:"enzui.control"});


var ENZObjectMinimum = (function() {
    var ENZObjectMinimum = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectMinimum.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (this._curValue > value.value) {
                this._curValue = value.value;
            }
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._curValue = value.value;
        }
    };

    var sortF = function(a, b) {return a-b;};
    
    $this.$list = function(inlet, value, event, count) {
        var list;
        if (inlet === 0) {
            list = value.value.sort(sortF);
            this._curValue = list[1];
            this.send(0, {type:NUMBER, value:list[0]}, event, count);
        }
    };
    
    return ENZObjectMinimum;
}());
enzui({klassName:"minimum", klass:ENZObjectMinimum,
       whatis:"Output the smallest in a list of numbers",
       category:"enzui.control"});



var ENZObjectNext = (function() {
    var ENZObjectNext = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectNext.prototype;

    $this.inlets  = 1;
    $this.outlets = 2;
    
    $this.onstart = function() {
        this._eventId = 0;
    };
    
    var f = function(inlet, value, event, count) {
        if (event && event === this._eventId) {
            this.send(1, {type:BANG}, event, count);
        } else {
            this.send(0, {type:BANG}, event, count);
            this._eventId = event;
        }
    };
    $this.$bang = $this.$number = $this.$list = $this.$string = f;
    
    return ENZObjectNext;
}());
enzui({klassName:"next", klass:ENZObjectNext,
       whatis:"Detect logical separation of messages",
       category:"enzui.control"});


var ENZObjectOneBang = (function() {
    var ENZObjectOneBang = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectOneBang.prototype;

    $this.inlets  = 2;
    $this.outlets = 2;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = true;
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = false;
        }
        
        this._reset = false;
    };
    
    $this.onstart = function() {
        this._reset = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(1, {type:BANG}, event, count);
            if (this._reset) {
                this.send(0, {type:BANG}, event, count);
                this._reset = false;
            }
        } else if (inlet === 1) {
            this._reset = true;
        }
    };
    
    $this.$stop = function(inlet, value, event, count) {
        this._reset = false;
    };
    
    return ENZObjectOneBang;
}());
enzui({klassName:"onebang", klass:ENZObjectOneBang,
       whatis:"Traffic control for bang messages",
       category:"enzui.control"});


var ENZObjectPeak = (function() {
    var ENZObjectPeak = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectPeak.prototype;

    $this.inlets  = 2;
    $this.outlets = 3;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (this._curValue < value.value) {
                this._curValue = value.value;
                this.send(1, {type:NUMBER, value:1}, event, count);
            } else {
                this.send(2, {type:NUMBER, value:1}, event, count);
            }
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._curValue = value.value;
            this.send(1, {type:NUMBER, value:1}, event, count);
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    var sortF = function(a, b) {return b-a;};

    $this.$list = function(inlet, value, event, count) {
        var list;
        if (inlet === 0) {
            list = value.value.sort(sortF);
            this._curValue = list[0];
            this.send(1, {type:NUMBER, value:1}, event, count);
            this.send(0, {type:NUMBER, value:list[0]}, event, count);
        }
    };
    
    return ENZObjectPeak;
}());
enzui({klassName:"peak", klass:ENZObjectPeak,
       whatis:"If a number is greater than previous numbers, output it",
       category:"enzui.control"});


var ENZObjectRoute = (function() {
    var ENZObjectRoute = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectRoute.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        var list, map, i;
        this.outlets = this.args.length + 1;
        map = {};
        list = this.args;
        for (i = list.length; i--; ) {
            map[list[i]] = i;
        }
        this._map = map;
    };

    $this.$string = function(inlet, value, event, count) {
        var v, i, k, undef;
        var index;
        
        v = value.value;
        if ((i = v.indexOf(" ")) !== -1) {
            k = v.substr(0, i);
            if ((index = this._map[k]) != undef) {
                value = this.str2val(v.substr(i).trim());
            } else {
                index = this.outlets - 1;
            }
        } else {
            index = this.outlets - 1;
        }
        this.send(index, value, event, count);
    };
    
    
    return ENZObjectRoute;
}());
enzui({klassName:"route", klass:ENZObjectRoute,
       whatis:"Selectively pass the output out a specific outlet",
       category:"enzui.control"});


var ENZObjectSelect = (function() {
    var ENZObjectSelect = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSelect.prototype;

    $this.inlets  = 1;
    $this.outlets = 2;
    
    $this.initialize = function() {
        var list, map, k, i;
        
        map  = {};
        this.defaults.selector = null;
        if (this.args.length === 0) {
            this.defaults.selector = 0;
            this.inlets = this.outlets = 2;
        } else if (this.args.length === 1 && !isNaN(this.args[0])) {
            this.defaults.selector = +this.args[0];
            this.inlets = this.outlets = 2;
        } else {
            this.outlets = this.args.length + 1;
            list = this.args;
            for (i = list.length; i--; ) {
                k = list[i];
                if (!isNaN(k)) k = +k;
                map[k] = i;
            }
        }
        this._map = map;
    };
    
    $this.onstart = function() {
        this._selector = this.defaults.selector;
    };

    $this.$number = function(inlet, value, event, count) {
        var v, i, undef;
        if (inlet === 0) {
            if (this._selector === null) {
                v = value.value;
                if ((i = this._map[v]) != undef) {
                    this.send(i, {type:BANG}, event, count);
                } else {
                    i = this.outlets - 1;
                    this.send(i, value, event, count);
                }
            } else {
                if (this._selector === value.value) {
                    this.send(0, {type:BANG}, event, count);
                } else {
                    this.send(1, value, event, count);
                }
            }
        } else {
            this._selector = value.value;
        }
    };
    
    $this.$string = function(inlet, value, event, count) {
        var v, i, undef;
        
        v = value.value;
        if ((i = this._map[v]) != undef) {
            value = this.str2val(v.substr(i).trim());
            this.send(i, {type:BANG}, event, count);
        } else {
            i = this.outlets - 1;
            this.send(i, value, event, count);
        }
        
    };
    
    
    return ENZObjectSelect;
}());
enzui({klassName:"select", klass:ENZObjectSelect,
       abbr:"sel",
       whatis:"Select certain inputs, pass the rest on",
       category:"enzui.control"});


var ENZObjectSplit = (function() {
    var ENZObjectSplit = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSplit.prototype;

    $this.inlets  = 3;
    $this.outlets = 2;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.min = +this.args[0];
        }
        if (!isNaN(this.args[1])) {
            this.defaults.max = +this.args[1];
        }

        if (isNaN(this.defaults.min)) {
            this.defaults.min = 0;
        }
        if (isNaN(this.defaults.max)) {
            this.defaults.max = Infinity;
        }
    };

    $this.onstart = function() {
        this._min = this.defaults.min;
        this._max = this.defaults.max;
    };

    $this.$number = function(inlet, value, event, count) {
        var v;
        if (inlet === 0) {
            v = value.value;
            if (this._min <= v && v <= this._max) {
                this.send(0, value, event, count);
            } else {
                this.send(1, value, event, count);
            }
        } else if (inlet === 1) {
            this._min = value.value;
        } else {
            this._max = value.value;
        }
    };

    $this.$list = function(inlet, value, event, count) {
        var l, v;
        l = value.value;
        if (l.length) {
            if (l.length >= 2) {
                this._min = l[1];
                if (l.length >= 3) {
                    this._max = l[2];
                }
            }
            v = l[0];
            if (this._min <= v && v <= this._max) {
                this.send(0, value, event, count);
            } else {
                this.send(1, value, event, count);
            }
        }
    };
    
    return ENZObjectSplit;
}());
enzui({klassName:"split", klass:ENZObjectSplit,
       whatis:"Look for a range of numbers",
       category:"enzui.control"});


var ENZObjectSwitch = (function() {
    var ENZObjectSwitch = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSwitch.prototype;

    $this.inlets  = 1;
    $this.outlets = 2;

    $this.initialize = function() {
        this.inlets = (this.args[0]|0)+1;

        if (!isNaN(this.args[1])) {
            this.defaults.value = this.args[1]|0;
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };

    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };


    var f = function(inlet, value, event, count) {
        if (inlet === this._curValue) {
            this.send(0, value, event, count);
        }
    };
    $this.$bang = $this.$list = $this.$string = f;
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = value.value|0;
        } else {
            f.call(this, inlet, value, event, count);
        }
    };
    
    return ENZObjectSwitch;
}());
enzui({klassName:"switch", klass:ENZObjectSwitch,
       whatis:"Output messages from a specific inlet",
       category:"enzui.control"});


var ENZObjectTogEdge = (function() {
    var ENZObjectTogEdge = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectTogEdge.prototype;

    $this.inlets  = 1;
    $this.outlets = 2;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = !!this.args[0] ? 1 : 0;
        }
        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (this._curValue) {
            this._curValue = 0;
            this.send(0, {type:NUMBER, value:0}, event, count);
        } else {
            this._curValue = 1;
            this.send(1, {type:NUMBER, value:1}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (this._curValue) {
            if (value.value === 0) {
                this._curValue = 0;
                this.send(0, {type:NUMBER, value:0}, event, count);
            }
        } else {
            if (value.value !== 0) {
                this._curValue = 1;
                this.send(1
, {type:NUMBER, value:1}, event, count);
            }
        }
    };
    
    return ENZObjectTogEdge;
}());
enzui({klassName:"togedge", klass:ENZObjectTogEdge,
       whatis:"Report zero/non-zero transitions",
       category:"enzui.control"});


var ENZObjectTrough = (function() {
    var ENZObjectTrough = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectTrough.prototype;

    $this.inlets  = 2;
    $this.outlets = 3;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (this._curValue > value.value) {
                this._curValue = value.value;
                this.send(1, {type:NUMBER, value:1}, event, count);
            } else {
                this.send(2, {type:NUMBER, value:1}, event, count);
            }
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._curValue = value.value;
            this.send(1, {type:NUMBER, value:1}, event, count);
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    var sortF = function(a, b) {return a-b;};

    $this.$list = function(inlet, value, event, count) {
        var list;
        if (inlet === 0) {
            list = value.value.sort(sortF);
            this._curValue = list[0];
            this.send(1, {type:NUMBER, value:1}, event, count);
            this.send(0, {type:NUMBER, value:list[0]}, event, count);
        }
    };
    
    return ENZObjectTrough;
}());
enzui({klassName:"trough", klass:ENZObjectTrough,
       whatis:"If a number is less than previous numbers, output it",
       category:"enzui.control"});


var ENZObjectUzi = (function() {
    var ENZObjectUzi = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectUzi.prototype;

    $this.inlets  = 2;
    $this.outlets = 3;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = this.args[0]|0;
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 1;
        } else if (this.defaults.value < 1) {
            this.defaults.value = 1;
        }
    };

    $this.onstart = function() {
        this._curValue = this.defaults.value;
        this._offset   = 0;
        this._break    = false;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        var i, imax;
        if (inlet === 0) {
            this._break = false;
            event = (+new Date() * 100 + Math.random() * 100)|0;
            for (i = this._offset, imax = this._curValue; i < imax; i++) {
                this.send(2, {type:NUMBER, value:i+1}, event, count);
                this.send(0, {type:BANG}, event, count);
                if (this._break) break;
            }
            if (!this._break) {
                this.send(1, {type:BANG}, event, count);
                this._offset = 0;
            } else {
                this._offset = i+1;
            }
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        var i, imax;
        
        this._curValue = value.value|0;
        if (this._curValue < 1) this._curValue = 1;
        
        if (inlet === 0) {
            this._break = false;
            event = (+new Date() * 100 + Math.random() * 100)|0;
            for (i = this._offset, imax = this._curValue; i < imax; i++) {
                this.send(2, {type:NUMBER, value:i+1}, event, count);
                this.send(0, {type:BANG}, event, count);
                if (this._break) break;
            }
            if (!this._break) {
                this.send(1, {type:BANG}, event, count);
                this._offset = 0;
            } else {
                this._offset = i+1;
            }
        }
    };
    
    $this.$pause = $this.$break = function(inlet, value, event, count) {
        this._break = true;
    };
    
    $this.$resume = $this.$continue = function(inlet, value, event, count) {
        if (this._break) {
            $this.$bang.call(this, inlet, value, event, count);
        }
    };
    
    return ENZObjectUzi;
}());
enzui({klassName:"uzi", klass:ENZObjectUzi,
       whatis:"Send a specific number of bang messages",
       category:"enzui.control"});






var ENZObjectAnal = (function() {
    var ENZObjectAnal = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAnal.prototype;

    $this.inlets  = 1;
    $this.outlets = 2;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._prevValue = null;
        this._map = {};
    };
    
    $this.$number = function(inlet, value, event, count) {
        var key, cnt, pv, vv;
        vv = value.value;
        if (this._prevValue !== null) {
            pv = this._prevValue;
            
            key = pv + ":" + vv;
            if (key in this._map) {
                this._map[key] = cnt = this._map[key] + 1;
            } else {
                cnt = this._map[key] = 1;
            }
            this._prevValue = vv;
            this.send(0, {type:LIST, value:[pv, vv, cnt]}, event, count);
        } else {
            this._prevValue = value.value;
            this.send(1, {type:LIST, value:[this.defaults.value, vv, 1]}, event, count);
        }
    };
    
    $this.$reset = function(inlet, value, event, count) {
        this._prevValue = null;
    };
    
    $this.$clear = function(inlet, value, event, count) {
        this._map = {};
    };
    
    return ENZObjectAnal;
}());
enzui({klassName:"anal", klass:ENZObjectAnal,
       whatis:"Make a histogram of number pairs received",
       category:"enzui.data"});

    
var ENZObjectCycle = (function() {
    var ENZObjectCycle = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCycle.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 1;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.outlets = this.args[0]|0;
        }
        this._sensitive = !!(this.args[1]|0);
    };
    
    $this.onstart = function() {
        this._countIndex = 0;
        this._sensEventCountIndex = {};
    };
    
    $this.$bang = function(inlet, value, event, count) {
        var index;
        if (this._sensitive) {
            if (!event) {
                this.send(0, value, event, count);
            } else {
                
                index = this._sensEventCountIndex[event];
                if (!index) index = 0;
                this.send(index, value, event, count);
                index += 1;
                if (index >= this.outlets) {
                    index = 0;
                }
                this._sensEventCountIndex[event] = index;
            }
        } else {
            this.send(this._countIndex, {type:BANG}, event, count);
            this._countIndex += 1;
            if (this._countIndex >= this.outlets) {
                this._countIndex = 0;
            }
        }
    };
    
    return ENZObjectCycle;
}());
enzui({klassName:"cycle", klass:ENZObjectCycle,
       whatis:"Send a stream of data to individual outlets",
       category:"enzui.data"});
    
    
var ENZObjectTable = (function() {
    var ENZObjectTable = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectTable.prototype;
    
    $this.inlets  = 2;
    $this.outlets = 2;
    
    $this.initialize = function() {
        this._table = {};
    };
    
    $this.onstart = function() {
        
    };

    $this.$number = function(inlet, value, event, count) {
        var k, v;
        k = value.value|0;
        if (k in this._table) {
            v = this._table[k];
            this.send(0, {type:NUMBER, value:v}, event, count);
        }
    };

    $this.$list = function(inlet, value, event, count) {
        var k, v;
        k = value.value[0]|0;
        v = value.value[1]|0;
        this._table[k] = v;
    };
    
    return ENZObjectTable;
}());
enzui({klassName:"table", klass:ENZObjectTable,
       whatis:"Store and graphically edit an array of numbers",
       category:"enzui.data"});
    

var ENZObjectProb = (function() {
    var ENZObjectProb = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectProb.prototype;

    $this.inlets  = 1;
    $this.outlets = 2;

    $this.initialize = function() {
        
    };

    $this.onstart = function() {
        this._curValue = 0;
        this._map = {};
    };
    
    $this.$number = function(inlet, value, event, count) {
        this._curValue = value.value;
    };

    $this.$bang = function(inlet, value, event, count) {
        var l, r, v, i, imax;
        l = this._map[this._curValue];
        if (l) {
            r = (Math.random() * (l.weight+1))|0;
            for (i = 0, imax = l.length; i < imax; i++) {
                r -= l[i][1];
                if (r <= 0) {
                    v = l[i][0];
                    this._curValue = v;
                    this.send(0, {type:NUMBER, value:v}, event, count);
                    break;
                }
            }
        } else {
            this.send(1, {type:BANG}, event, count);
        }
    };

    $this.$list = function(inlet, value, event, count) {
        var l, k, v, w, i, b;
        l = value.value;
        if (l.length === 3) {
            k = l[0];
            v = l[1];
            w = l[2];
            if (k in this._map) {
                l = this._map[k];
                b = false;
                for (i = l.length; i--; ) {
                    if (l[i][0] === v) {
                        l[i][1] = w;
                        b = true;
                        break;
                    }
                }
                if (!b) {
                    l.push([v, w]);
                }
                l.sort(function(a, b) { return b[1] - a[1]; });
            } else {
                l = [[v,w]];
            }

            w = 0;
            for (i = l.length; i--; ) {
                w += l[i][1];
            }
            l.weight = w;
            this._map[k] = l;
        }
    };
    
    return ENZObjectProb;
}());
enzui({klassName:"prob", klass:ENZObjectProb,
       whatis:"Make a weighted random series of numbers",
       category:"enzui.data"});

    
var ENZObjectValue = (function() {
    var ENZObjectValue = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectValue.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        this.name = this.args[0] || "";
        this.objectbox.setValueObject(this.name, this);
    };
    
    $this.destroy = function() {
        this.objectbox.removeValueObject(this.name, this);
    };

    $this.onstart = function() {
        this._buddies  = this.objectbox.getValueObjects(this.name);
        this._curValue = {type:NUMBER, value:0};
    };
    
    $this.$bang = function(inlet, value, event, count) {
        var i, _buddies, _curValue;
        _buddies  = this._buddies;
        _curValue = this._curValue;
        for (i = _buddies.length; i--; ) {
            _buddies[i].send(0, _curValue, event, count);
        }
    };
    
    $this.$number = $this.string = $this.$list = function(inlet, value, event, count) {
        var i, _buddies, _curValue;
        _buddies  = this._buddies;
        _curValue = this._curValue = value;
        for (i = _buddies.length; i--; ) {
            _buddies[i].send(0, _curValue, event, count);
        }
    };
    
    return ENZObjectValue;
}());
enzui({klassName:"value", klass:ENZObjectValue,
       whatis:"Share a stored number with other objects",
       category:"enzui.data"});
    
    


    


    




var ENZObjectKeyDown = (function() {
    var ENZObjectKeyDown = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectKeyDown.prototype;

    $this.inlets  = 0;
    $this.outlets = 2;
    
    $this.initialize = function() {
        this.objectbox.setKeyDownObject(this);
    };
    
    $this.destroy = function() {
        this.objectbox.removeKeyDownObject(this);
    };

    $this.key = function(e) {
        // this.send(1, {type:NUMBER, value:e.keyCode});
        this.send(0, {type:NUMBER, value:e.keyCode});
    };
    
    return ENZObjectKeyDown;
}());
enzui({klassName:"keydown", klass:ENZObjectKeyDown,
       whatis:"Report key down on the computer keyboard",
       category:"enzui.interaction"});


var ENZObjectKeyUp = (function() {
    var ENZObjectKeyUp = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectKeyUp.prototype;
    
    $this.inlets  = 0;
    $this.outlets = 2;
    
    $this.initialize = function() {
        this.objectbox.setKeyUpObject(this);
    };
    
    $this.destroy = function() {
        this.objectbox.removeKeyUpObject(this);
    };

    $this.key = function(e) {
        // this.send(1, {type:NUMBER, value:e.keyCode});
        this.send(0, {type:NUMBER, value:e.keyCode});
    };
    
    return ENZObjectKeyUp;
}());
enzui({klassName:"keyup", klass:ENZObjectKeyUp,
       whatis:"Report key up on the computer keyboard",
       category:"enzui.interaction"});
    


    



    
var ENZObjectPack = (function() {
    var ENZObjectPack = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectPack.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 1;
    
    $this.initialize = function() {
        if (this.args.length) {
            this.inlets = this.args.length|0;
            this.defaults.values = this.args.map(function(n) { return +n; });
        } else {
            this.defaults.values = [ 0 ];
        }
    };
    
    $this.onstart = function() {
        this._curValues = this.defaults.values.slice(0);
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:LIST, value:this._curValues}, event, count);
        }
    };

    $this.$number = function(inlet, value, event, count) {
        this._curValues[inlet] = +value.value;
        if (inlet === 0) {
            this.send(0, {type:LIST, value:this._curValues}, event, count);
        }
    };
    
    return ENZObjectPack;
}());
enzui({klassName:"pack", klass:ENZObjectPack,
       whatis:"Combine numbers and symbols into a list",
       category:"enzui.lists"});
    
    
var ENZObjectUnpack = (function() {
    var ENZObjectUnpack = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectUnpack.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;
    
    $this.initialize = function() {
        var i, items;
        this.defaults.values = [];
        this.defaults.types = [];
        this.defaults.casts = [];
        
        if (this.args.length) {
            this.outlets = this.args.length|0;
            items = this.args;
            for (i = items.length; i--; ) {
                if (!isNaN(items[i])) {
                    this.defaults.values[i] = +items[i];
                    this.defaults.types[i] = NUMBER;
                    this.defaults.casts[i] = $this.castFLOAT;
                } else if (items[i] === "bang") {
                    this.defaults.values[i] = BANG;
                    this.defaults.types[i] = BANG;
                    this.defaults.casts[i] = $this.NOP;
                } else {
                    this.defaults.values[i] = "" + items[i];
                    this.defaults.types[i] = STRING;
                    this.defaults.casts[i] = $this.castSTR;
                }
            }
        } else {
            this.defaults.values[0] = 0;
            this.defaults.types[0] = NUMBER;
            this.defaults.casts[0] = $this._castINT;
        }
    };
    
    $this.onstart = function() {
        this._curValues = this.defaults.values.slice(0);
    };

    $this.$bang = function(inlet, value, event, count) {
        var i;
        var _curValues, types;
        
        _curValues = this._curValues;
        types = this.defaults.types;
        for (i = this.outlets; i--; ) {
            this.send(i, {type:types[i], value:_curValues[i]}, event, count);
        }
    };
    
    $this.$list = function(inlet, value, event, count) {
        var i, imax, items;
        var _curValues, casts, types;

        items = value.value;
        imax = this.outlets;
        if (items.length < imax) {
            imax = items.length;
        }
        
        _curValues = this._curValues;
        casts = this.defaults.casts;
        types = this.defaults.types;
        for (i = imax; i--; ) {
            _curValues[i] = casts[i](items[i]);
        }
        
        for (i = this.outlets; i--; ) {
            this.send(i, {type:types[i], value:_curValues[i]}, event, count);
        }
    };
    
    return ENZObjectUnpack;
}());
enzui({klassName:"unpack", klass:ENZObjectUnpack,
       whatis:"Break a list into individual messages",
       category:"enzui.lists"});
    
    




var ENZObjectAdd = (function() {
    var ENZObjectAdd = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAdd.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;
    
    $this.initialize = function() {
        this._floatType = true;
        
        if (!isNaN(this.args[0])) {
            this.defaults.value2 = +this.args[0];
        }
        
        if (isNaN(this.defaults.value2)) {
            this.defaults.value2 = 0;
        }
        
        if (this.defaults.type === "int") {
            this._floatType = false;
        }
        if (this._floatType) {
            this._cast = $this.castFLOAT;
        } else {
            this._cast = $this.castINT;
        }
    };
    
    $this.doCalc = function() {
        return this._value1 + this._value2;
    };
    
    $this.onstart = function() {
        this._value1 = 0;
        this._value2 = this.defaults.value2;
        this._curValue = this.doCalc();
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._value1 = value.value;
            this._curValue = this._cast(this.doCalc());
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._value2 = value.value;
        }
    };
    
    $this.$list = function(inlet, value, event, count) {
        var items;
        if (inlet === 0) {
            items = value.value;
            if (items[1] && !isNaN(items[1])) {
                this._value2 = Number(items[1]);
                if (items[0] && !isNaN(items[0])) {
                    this._value1 = items[0];
                    this._curValue = this._cast(this.doCalc());
                    this.send(0, {type:NUMBER, value:this._curValue}, event, count);
                }
            }
        }
    };
    
    $this.$set = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (value.value && !isNaN(value.value)) {
                this._value1 = value.value;
                this._curValue = this._cast(this.doCalc());
            }
        }
    };
    
    return ENZObjectAdd;
}());
enzui({klassName:"+", klass:ENZObjectAdd,
       whatis:"Add two numbers, output the result",
       category:"enzui.math"});
    
    
var ENZObjectSubtract = (function() {
    var ENZObjectSubtract = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSubtract.prototype;

    $this.doCalc = function() {
        return this._value1 - this._value2;
    };
    
    return ENZObjectSubtract;
}());
enzui({klassName:"-", klass:ENZObjectSubtract, extend:"+",
       whatis:"Subtract two numbers, output the result",
       category:"enzui.math"});
    
    
var ENZObjectReversedSubtract = (function() {
    var ENZObjectReversedSubtract = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectReversedSubtract.prototype;

    $this.doCalc = function() {
        return this._value2 - this._value1;
    };
    
    return ENZObjectReversedSubtract;
}());
enzui({klassName:"!-", klass:ENZObjectReversedSubtract, extend:"+",
       whatis:"Subtract two numbers, output the result(inlets reversed)",
       category:"enzui.math"});


var ENZObjectMultiply = (function() {
    var ENZObjectMultiply = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectMultiply.prototype;

    $this.doCalc = function() {
        return this._value1 * this._value2;
    };
    
    return ENZObjectMultiply;
}());
enzui({klassName:"*", klass:ENZObjectMultiply, extend:"+",
       whatis:"Multiply two numbers, output the result",
       category:"enzui.math"});
    
    
var ENZObjectDivision = (function() {
    var ENZObjectDivision = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectDivision.prototype;
    
    $this.doCalc = function() {
        if (this._value2 === 0) {
            return this._value1;
        } else {
            return this._value1 / this._value2;
        }
    };
    
    return ENZObjectDivision;
}());
enzui({klassName:"/", klass:ENZObjectDivision, extend:"+",
       whatis:"Multiply two numbers, output the result",
       category:"enzui.math"});
    
    
var ENZObjectReversedDivision = (function() {
    var ENZObjectReversedDivision = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectReversedDivision.prototype;
    
    $this.doCalc = function() {
        if (this._value1 === 0) {
            return this._value2;
        } else {
            return this._value2 / this._value1;
        }
    };
    
    return ENZObjectReversedDivision;
}());
enzui({klassName:"!/", klass:ENZObjectReversedDivision, extend:"+",
       whatis:"Multiply two numbers, output the result(inlets reversed)",
       category:"enzui.math"});
    
    
var ENZObjectModulo = (function() {
    var ENZObjectModulo = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectModulo.prototype;
    
    $this.doCalc = function() {
        if (this._value2 === 0) {
            return this._value1;
        } else {
            return this._value1 % this._value2;
        }
    };
    
    return ENZObjectModulo;
}());
enzui({klassName:"%", klass:ENZObjectModulo, extend:"+",
       whatis:"Multiply two numbers, output the result",
       category:"enzui.math"});
    
    
var ENZObjectReversedModulo = (function() {
    var ENZObjectReversedModulo = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectReversedModulo.prototype;
    
    $this.doCalc = function() {
        if (this._value1 === 0) {
            return this._value2;
        } else {
            return this._value2 % this._value1;
        }
    };
    
    return ENZObjectReversedModulo;
}());
enzui({klassName:"!%", klass:ENZObjectReversedModulo, extend:"+",
       whatis:"Multiply two numbers, output the result(inlets reversed)",
       category:"enzui.math"});
    
    
var ENZObjectPow = (function() {
    var ENZObjectPow = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectPow.prototype;

    $this.doCalc = function() {
        return Math.pow(this._value1, this._value2);
    };
    
    return ENZObjectPow;
}());
enzui({klassName:"pow", klass:ENZObjectPow, extend:"+",
       whatis:"Computes x to the power of y",
       category:"enzui.math"});
    
    
var ENZObjectCompareEqual = (function() {
    var ENZObjectCompareEqual = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCompareEqual.prototype;

    $this.inlets  = 2;
    $this.outlets = 2;
    
    $this.doCalc = function() {
        return (this._value1 === this._value2) ? 1 : 0;
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._value1 = value.value;
            this._curValue = this._cast(this.doCalc());
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
            if (this._curValue) {
                this.send(1, {type:BANG}, event, count);
            }
        } else {
            this._value2 = value.value;
        }
    };
    
    $this.$list = function(inlet, value, event, count) {
        var items;
        if (inlet === 0) {
            items = value.value;
            if (items[1] && !isNaN(items[1])) {
                this._value2 = Number(items[1]);
                if (items[0] && !isNaN(items[0])) {
                    this._value1 = items[0];
                    this._curValue = this._cast(this.doCalc());
                    this.send(0, {type:NUMBER, value:this._curValue}, event, count);
                    if (this._curValue) {
                        this.send(1, {type:BANG}, event, count);
                    }
                }
            }
        }
    };
    
    return ENZObjectCompareEqual;
}());
enzui({klassName:"==", klass:ENZObjectCompareEqual, extend:"+",
       whatis:"Compare two numbers, output 1 if they are equal",
       category:"enzui.math"});
    
    
var ENZObjectCompareNotEqual = (function() {
    var ENZObjectCompareNotEqual = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCompareNotEqual.prototype;
    
    $this.doCalc = function() {
        return (this._value1 !== this._value2) ? 1 : 0;
    };
    
    return ENZObjectCompareNotEqual;
}());
enzui({klassName:"!=", klass:ENZObjectCompareNotEqual, extend:"==",
       whatis:"Compare two numbers, output 1 if they are not equal",
       category:"enzui.math"});
    
    
var ENZObjectCompareLess = (function() {
    var ENZObjectCompareLess = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCompareLess.prototype;
    
    $this.doCalc = function() {
        return (this._value1 < this._value2) ? 1 : 0;
    };
    
    return ENZObjectCompareLess;
}());
enzui({klassName:"<", klass:ENZObjectCompareLess, extend:"==",
       whatis:"Is less than, comparison of two numbers",
       category:"enzui.math"});
    
    
var ENZObjectCompareLessEqual = (function() {
    var ENZObjectCompareLessEqual = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCompareLessEqual.prototype;
    
    $this.doCalc = function() {
        return (this._value1 <= this._value2) ? 1 : 0;
    };
    
    return ENZObjectCompareLessEqual;
}());
enzui({klassName:"<=", klass:ENZObjectCompareLessEqual, extend:"==",
       whatis:"Is less than or equal to, comparison of two numbers",
       category:"enzui.math"});
    
    
var ENZObjectCompareGreater = (function() {
    var ENZObjectCompareGreater = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCompareGreater.prototype;
    
    $this.doCalc = function() {
        return (this._value1 > this._value2) ? 1 : 0;
    };
    
    return ENZObjectCompareGreater;
}());
enzui({klassName:">", klass:ENZObjectCompareGreater, extend:"==",
       whatis:"Is greater than, comparison of two numbers",
       category:"enzui.math"});
    
    
var ENZObjectCompareGreaterEqual = (function() {
    var ENZObjectCompareGreaterEqual = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCompareGreaterEqual.prototype;
    
    $this.doCalc = function() {
        return (this._value1 >= this._value2) ? 1 : 0;
    };
    
    return ENZObjectCompareGreaterEqual;
}());
enzui({klassName:">=", klass:ENZObjectCompareGreaterEqual, extend:"==",
       whatis:"Is greater than or equal to, comparison of two numbers",
       category:"enzui.math"});
    
    
var ENZObjectBitwiseIntersection = (function() {
    var ENZObjectBitwiseIntersection = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectBitwiseIntersection.prototype;
    
    $this.doCalc = function() {
        return (this._value1|0) & (this._value2|0);
    };
    
    return ENZObjectBitwiseIntersection;
}());
enzui({klassName:"&", klass:ENZObjectBitwiseIntersection, extend:"+",
       whatis:"Is greater than or equal to, comparison of two numbers",
       category:"enzui.math"});
    
    
var ENZObjectBitwiseUnion = (function() {
    var ENZObjectBitwiseUnion = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectBitwiseUnion.prototype;
    
    $this.doCalc = function() {
        return (this._value1|0) | (this._value2|0);
    };
    
    return ENZObjectBitwiseUnion;
}());
enzui({klassName:"|", klass:ENZObjectBitwiseUnion, extend:"+",
       whatis:"Bitwise union of two numbers",
       category:"enzui.math"});
    
    
var ENZObjectAndAnd = (function() {
    var ENZObjectAndAnd = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAndAnd.prototype;
    
    $this.doCalc = function() {
        return (this._value1 && this._value2) ? 1 : 0;
    };
    
    return ENZObjectAndAnd;
}());
enzui({klassName:"&&", klass:ENZObjectAndAnd, extend:"+",
       whatis:"If both numbers are non-zero, output a 1",
       category:"enzui.math"});
    
    
var ENZObjectOrOr = (function() {
    var ENZObjectOrOr = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectOrOr.prototype;
    
    $this.doCalc = function() {
        return (this._value1 || this._value2) ? 1 : 0;
    };
    
    return ENZObjectOrOr;
}());
enzui({klassName:"||", klass:ENZObjectOrOr, extend:"+",
       whatis:"If either of two numbers is non-zero, output a 1",
       category:"enzui.math"});
    
    
var ENZObjectAbs = (function() {
    var ENZObjectAbs = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAbs.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;
    
    $this.initialize = function() {
        this._curValue = 0;
        this.str = this.command;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var val;
        val = Math.abs(value.value);
        this.send(0, {type:NUMBER, value:val}, event, count);
    };
    
    return ENZObjectAbs;
}());
enzui({klassName:"abs", klass:ENZObjectAbs,
       whatis:"Output the absolute value of the input",
       category:"enzui.math"});
    
    
var ENZObjectAccum = (function() {
    var ENZObjectAccum = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAccum.prototype;

    $this.inlets  = 3;
    $this.outlets = 1;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = value.value;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else if (inlet === 1) {
            this._curValue = this._curValue + value.value;
        } else {
            this._curValue = this._curValue * value.value;
        }
    };
    
    $this.$set = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (value.value && !isNaN(value.value)) {
                this._curValue = value.value;
            }
        }
    };
    
    return ENZObjectAccum;
}());
enzui({klassName:"accum", klass:ENZObjectAccum,
       whatis:"Store, add to, and multiply a number",
       category:"enzui.math"});
    

var ENZObjectSqrt = (function() {
    var ENZObjectSqrt = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSqrt.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;
    $this._func = Math.sqrt;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }
        
        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
    };    
    
    $this.$number = function(inlet, value, event, count) {
        var v = this._func(value.value);
        if (!isNaN(v)) {
            this._curValue = v;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    return ENZObjectSqrt;
}());
enzui({klassName:"sqrt", klass:ENZObjectSqrt,
       whatis:"Square root function",
       category:"enzui.math"});
    
    
var ENZObjectAcos = (function() {
    var ENZObjectAcos = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAcos.prototype;

    $this._func = Math.acos;
    
    return ENZObjectAcos;
}());
enzui({klassName:"acos", klass:ENZObjectAcos, extend:"sqrt",
       whatis:"Arc-cosine function",
       category:"enzui.math"});
    
    
var ENZObjectAsin = (function() {
    var ENZObjectAsin = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAsin.prototype;

    $this._func = Math.asin;
    
    return ENZObjectAsin;
}());
enzui({klassName:"asin", klass:ENZObjectAsin, extend:"sqrt",
       whatis:"Arc-sine function",
       category:"enzui.math"});
    

var ENZObjectAtan = (function() {
    var ENZObjectAtan = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAtan.prototype;

    $this._func = Math.atan;
    
    return ENZObjectAtan;
}());
enzui({klassName:"atan", klass:ENZObjectAtan, extend:"sqrt",
       whatis:"Arc-tangent function",
       category:"enzui.math"});
    
    
var ENZObjectCos = (function() {
    var ENZObjectCos = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectCos.prototype;

    $this._func = Math.cos;
    
    return ENZObjectCos;
}());
enzui({klassName:"cos", klass:ENZObjectCos, extend:"sqrt",
       whatis:"Arc-tangent function",
       category:"enzui.math"});
    
    
var ENZObjectSin = (function() {
    var ENZObjectSin = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSin.prototype;

    $this._func = Math.sin;
    
    return ENZObjectSin;
}());
enzui({klassName:"sin", klass:ENZObjectSin, extend:"sqrt",
       whatis:"Arc-tangent function",
       category:"enzui.math"});
    
    
var ENZObjectTan = (function() {
    var ENZObjectTan = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectTan.prototype;

    $this._func = Math.tan;
    
    return ENZObjectTan;
}());
enzui({klassName:"tan", klass:ENZObjectTan, extend:"sqrt",
       whatis:"Arc-tangent function",
       category:"enzui.math"});


var ENZObjectAtan2 = (function() {
    var ENZObjectAtan2 = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectAtan2.prototype;
    
    $this.doCalc = function() {
        return Math.atan(this._value1, this._value2);
    };
    
    return ENZObjectAtan2;
}());
enzui({klassName:"atan2", klass:ENZObjectAtan2, extend:"+",
       whatis:"Arc-tangent function (two variables)",
       category:"enzui.math"});
    
    
var ENZObjectClip = (function() {
    var ENZObjectClip = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectClip.prototype;
    
    $this.inlets  = 3;
    $this.outlets = 1;

    $this.initialize = function() {
        this._argValues = [ 0, 0, 0 ];
        
    };
    
    return ENZObjectClip;
}());
    
var ENZObjectMtoF = (function() {
    var ENZObjectMtoF = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectMtoF.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;
    
    $this.$number = function(inlet, value, event, count) {
        var i = value.value|0;
        if (0 <= i && i < 128) {
            this.send(0, {type:NUMBER, value:mtofTable[i]}, event, count);
        }
    };

    var mtofTable = (function() {
        var list, i;
        list = new Float32Array(128);
        for (i = 0; i < 128; i++) {
            list[i] = 440 * Math.pow(Math.pow(2, 1 / 12), i - 69);
        }
        return list;
    }());
    
    return ENZObjectMtoF;
}());
enzui({klassName:"mtof", klass:ENZObjectMtoF,
       whatis:"Convert a MIDI note number to frequency",
       category:"enzui.math"});
    
    

var Random = (function() {
    var Random = function() {
        this.initialize.apply(this, arguments);
    }, $this = Random.prototype;
    
    $this.initialize = function(x) {
        this._x = new Uint32Array(32);
        this.seed(x);
    };
    
    $this.seed = function(s) {
        var x, i;
        
        if (s === null || isNaN(s)) {
            s = (+new Date() * 1000) + Math.random() * 1000;
        }
        s = s|0;
        x = this._x;
        
        x[0] = 3;
        x[1] = s;
        for (i = 2; i <= 31; i++) {
            s = (16807 * s) & 0x7FFFFFFF;
            x[i] = s;
        }
        for (i = 310; i--; ) this.next();
    };
    
    $this.next = function() {
        var x, n;
        
        x = this._x;
        n = x[0];
        n = (n === 31) ? 1 : n+1;
        
        x[0] = n;
        x[n] += (n > 3) ? x[n-3] : x[n+31-3];
        
        return (x[n]>>>1) / 2147483647;
    };
    
    return Random;
}());
    

var ENZObjectRandom = (function() {
    var ENZObjectRandom = function() {
        this.initialize.apply(this, arguments);
    },  $this = ENZObjectRandom.prototype;
    
    $this.inlets  = 2;
    $this.outlets = 1;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.max = this.args[0]|0;
        }
        if (!isNaN(this.args[1])) {
            this.defaults.seed = this.args[1]|0;
        }
        if (isNaN(this.defaults.max)) {
            this.defaults.max = 1;
        }
        if (isNaN(this.defaults.seed)) {
            this.defaults.seed = null;
        }
    };
    
    $this.onstart = function() {
        this._maxValue = this.defaults.max;
        this._random = new Random(this.defaults.seed);
    };
    
    $this.$bang = function(inlet, value, event, count) {
        var v;
        if (inlet === 0) {
            v = (this._random.next() * this._maxValue) | 0;
            this.send(0, {type:NUMBER, value:v}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 1) {
            this._maxValue = value.value|0;
        }
    };
    
    $this.$max = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (value.value && !isNaN(value.value)) {
                this._maxValue = value.value|0;
            }
        }
    };
    
    $this.$seed = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (value.value && !isNaN(value.value)) {
                this._random = new Random(value.value|0);
            } else {
                this._random = new Random(null);
            }
        }
    };
    
    return ENZObjectRandom;
}());
enzui({klassName:"random", klass:ENZObjectRandom,
       whatis:"Generate a random number",
       category:"enzui.math"});
    
    
var ENZObjectDrunk = (function() {
    var ENZObjectDrunk = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectDrunk.prototype;

    $this.inlets  = 3;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.max = this.args[0]|0;
        }
        if (!isNaN(this.args[1])) {
            this.defaults.step = this.args[1]|0;
        }
        if (!isNaN(this.args[2])) {
            this.defaults.seed = this.args[2]|0;
        }
        if (isNaN(this.defaults.max)) {
            this.defaults.max = 128;
        }
        if (isNaN(this.defaults.step)) {
            this.defaults.step = 2;
        }
        if (isNaN(this.defaults.seed)) {
            this.defaults.seed = null;
        }
        
        this.defaults.max |= 0;
        if (this.defaults.max < 0) this.defaults.max = 0;
        
        this.defaults.step |= 0;
        if (this.defaults.step < 0) this.defaults.step = 0;
    };
    
    $this.onstart = function() {
        this._max  = this.defaults.max;
        this._step = this.defaults.step;
        this._random = new Random(this.defaults.seed);
        this._curValue = 0;
    };

    $this.$bang = function(inlet, value, event, count) {
        var min, max, v;
        
        if (inlet === 0) {
            min = this._curValue - (this._step-1);
            max = this._curValue + (this._step);
            if (min < 0) min = 0;
            if (this._max < max) max = this._max;
            v = this._random.next();
            v = (v * (max - min) + min)|0;
            this._curValue = v;
            this.send(0, {type:NUMBER, value:v}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        var v;
        v = value.value|0;
        if (inlet === 0) {
            if (v < 0) {
                v = 0;
            } else if (this._max < v) {
                v = this._max;
            }
            this._curValue = v;
            this.send(0, {type:NUMBER, value:v}, event, count);
        } else if (inlet === 1) {
            this._max = v;
        } else {
            if (v < 0) v = 0;
            this._step = v;
        }
    };

    $this.$seed = function(inlet, value, event, count) {
        if (inlet === 0) {
            if (value.value && !isNaN(value.value)) {
                this._random = new Random(value.value|0);
            } else {
                this._random = new Random(null);
            }
        }
    };

    $this.$set = function(inlet, value, event, count) {
        var v;
        v = value.value|0;
        if (inlet === 0) {
            if (v < 0) {
                v = 0;
            } else if (this._max < v) {
                v = this._max;
            }
            this._curValue = v;
        }
    };
    
    return ENZObjectDrunk;
}());
enzui({klassName:"drunk", klass:ENZObjectDrunk,
       whatis:"Output random numbers in a moving range",
       category:"enzui.math"});


var ENZObjectSum = (function() {
    var ENZObjectSum = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSum.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        var n;
        n = this.args.length;
        if (n < 1) n = 1;
        this.inlets = n;
    };
    
    $this.onstart = function() {
        if (this.args.length === 0) {
            this._values = new Float32Array(1);
        } else {
            this._values = new Float32Array(this.args);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        var l, i, v;
        
        l = this._values;
        l[inlet] = value.value;
        
        v = 0;
        for (i = l.length; i--; ) {
            v += l[i];
        }
        this.send(0, {type:NUMBER, value:v}, event, count);
    };
    
    return ENZObjectSum;
}());
enzui({klassName:"sum!", klass:ENZObjectSum,
       whatis:"sum values",
       category:"enzui.math"});

    



 var TemplateList = (function() {
     var TemplateList = function() {
         this.initialize.apply(this, arguments);
     }, $this = TemplateList.prototype;
     
     $this.initialize = function(str, values) {
         this._values = values;
         compile.call(this, str);
     };
     
     $this.getList = function() {
         return this._list;
     };
     
     var compile = function(str) {
         var result, chars;
         var ch, i, l, quote, esc;
         result = [];
             chars  = [];
         
         i = 0;
         l = str.length;
         quote = esc = false;
         while (i < l) {
             ch = str[i++];
             if (ch === "\\") {
                 if (esc) {
                     chars.push("\\\\");
                 }
                 esc = !esc;
                 continue;
             } else if (ch === '"') {
                 if (!esc) {
                     quote = !quote;
                     chars.push(ch);
                     continue;
                 }
             } else if (ch === "," || ch === ";") {
                 if (!quote && !esc) {
                     chars = chars.join("").trim();
                     if (chars.length > 0) {
                         result.push(new Template(this, chars));
                     }
                     chars = [ch];
                     continue;
                 }
             }
             chars.push(ch);
             esc = false;
         }
         chars = chars.join("").trim();
         if (chars.length > 0) {
             result.push(new Template(this, chars));
         }
         this._list = result;
     };
     
     var Template = (function() {
         var Template = function() {
             this.initialize.apply(this, arguments);
         }, $this = Template.prototype;
             
         $this.initialize = function(parent, str) {
             this._parent = parent;
             this._origin = str;
             compile.call(this, str);
         };
         
         $this.toString = function() {
             return this._tmpl.join(" ");
         };
         
         var token = function(str, values) {
             var i;
             if (str[0] === "$") {
                 i = str.substr(1)|0;
                 if (1 <= i && i < 10) {
                     return values[i-1];
                 }
             }
             return str;
         };
         
         var compile = function(str) {
             var result, chars;
             var ch, i, l, quote, esc, index;
             if (str[0] === ";") {
                 str = str.substr(1).trim();
                 if ((i = str.indexOf(" ")) !== -1) {
                     this.sendTo = token(str.substr(0, i), this._parent._values);
                     str = str.substr(i+1);
                 }                 
             } else if (str[0] === ",") {
                 str = str.substr(1).trim();
             }
             
             result = [];
             chars  = [];
             
             i = 0;
             l = str.length;
             quote = esc = false;
             while (i < l) {
                 ch = str[i++];
                 if (ch === "\\") {
                     if (esc) {
                         chars.push("\\");
                     }
                     esc = !esc;
                     continue;
                 } else if (ch === '"') {
                     if (!esc) {
                         quote = !quote;
                         chars.push(ch);
                         continue;
                     }
                 } else if (ch === " ") {
                     if (!quote && !esc) {
                         chars = chars.join("").trim();
                         if (chars.length > 0) {
                             result.push(token(chars, this._parent._values));
                         }
                         chars = [];
                         continue;
                     }
                 }
                 chars.push(ch);
                 esc = false;
             }
             
             chars = chars.join("").trim();
             if (chars.length > 0) {
                 result.push(token(chars, this._parent._values));
             }
             this._tmpl = result;
         };
         
         return Template;
     }());
     
     return TemplateList;
 }());


var ENZObjectMessageBox = (function() {
    var ENZObjectMessageBox = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectMessageBox.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;
    $this.backcolor = "lightgray";
    $this.minWidth = 20;
    
    var $toString = function() { return this.value; };
    
    $this.initialize = function() {
         var i;
         this._values = [];
         for (i = 0; i < 10; i++) {
             this._values.push({value:0, toString:$toString});
         }
        
        this.str = this.args.join(" ");
        this.defaults.tmpl = new TemplateList(this.str, this._values);
        this._tmpl = this.defaults.tmpl;
    };

    $this.onstart = function() {
        var i, _values;
        _values = this._values;
        for (i = 10; i--; ) {
            _values[i].value = 0;
        }
        this._tmpl = this.defaults.tmpl;
        this._curValue = this._prev = this.str;
    };
    
    $this._setValue = function(i, v) {
        if (1 <= 1 && i < 10) {
            this._values[i-1].value = v;
        }
    };
    
    $this._send = function(event, count) {
        var list, i, imax;
        var v, sendTo;
        var objectbox, buddies, j;
        
        list = this._tmpl.getList();
        objectbox = this.objectbox;
        if (list.length > 1) {
            if (!event) event = +new Date() + Math.random();
            for (i = 0, imax = list.length; i < imax; i++) {
                v = {type:ANY, value:list[i].toString()};
                sendTo = list[i].sendTo;
                if (sendTo) {
                    buddies = objectbox.getReceiveObjects(sendTo);
                    for (j = buddies.length; j--; ) {
                        buddies[j].send(0, v, event, count);
                    }
                } else {
                    this.send(0, v, event, count);
                }
            }
        } else {
            v = {type:ANY, value:list[0].toString()};
            sendTo = list[0].sendTo;
            if (sendTo) {
                buddies = objectbox.getReceiveObjects(sendTo);
                for (j = buddies.length; j--; ) {
                    buddies[j].send(0, v, event, count);
                }
            } else {
                this.send(0, v, event, count);
            }
        }
    };
    
    $this.$bang = function(inlet, value, event, count) {
        this._send(event, count);
    };
    
    $this.$number = function(inlet, value, event, count) {
        this._setValue(1, value.value);
        this._send(event, count);
    };

    $this.$string = function(inlet, value, event, count) {
        this._setValue(1, value.value);
        this._send(event, count);
    };
    
    $this.$list = function(inlet, value, event, count) {
        var list, i, l;
        list = value.value;
        for (i = list.length; i--; ) {
            this._setValue(i+1, list[i]);
        }
        this._send(event, count);
    };

    $this.$set = function(inlet, value, event, count) {
        this._curValue = value.value;
        this._tmpl = new TemplateList(this._curValue, this._values);
    };
    
    $this.onmousedown = function(x, y) {
        this._send();
    };
    
    $this.draw = function(painter, x, y, w, h, animate) {
        var _y, lines, dy, i, imax;
        painter.rect(x, y, w, h, "dimgray", this.backcolor);
        lines = this.splitText(painter);
        
        painter.textlines(lines, x+2, y+2, w-4, h-5, this.forecolor);
        
        _y = y + h - 4;
        painter.drawtheline(x, _y, x + w, _y);
    };

    $this.onanimate = function(painter, x, y, w, h) {
        var _y, lines, dy, i, imax;
        if (this._curValue !== this._prev) {
            painter.rect(x, y, w, h, "dimgray", this.backcolor);
            lines = this.splitText(painter);
            
            painter.textlines(lines, x+2, y+2, w-4, h-5, this.forecolor);
            
            _y = y + h - 4;
            painter.drawtheline(x, _y, x + w, _y);
            
            this._prev = this._curValue;
        }
    };

    $this.splitText = function(painter) {
        var i, imax;
        var list0, list1, list2, s;
        var mt, width;
        list0 = this._tmpl._list;
        list1 = [];
        for (i = 0, imax = list0.length; i < imax; i++) {
            s = list0[i]._origin;
            if (s[0] === ",") {
                if (i > 0) {
                    list1[list1.length-1] += ",";
                }
                s = s.substr(1).trim();
            } else if (s[0] === ";") {
                if (i > 0) {
                    list1[list1.length-1] += ";";
                } else {
                    list1.push(";");
                }
                s = s.substr(1).trim();
            }
            list1.push(s);
        }
        
        list2 = [];
        width = this.objectbox.width;
        for (i = 0, imax = list1.length; i < imax; i++) {
            mt = painter.measureText(list1[i]);
            if (mt.width < width) {
                list2.push(list1[i]);
            } else {
                list2.push(list1[i]);
            }
        }
        return list2;
    };
    
    return ENZObjectMessageBox;
}());
enzui({klassName:"message", klass:ENZObjectMessageBox,
       abbr: "m:",
       whatis:"Message",
       category:"enzui.message"});
    

var ENZObjectReceive = (function() {
    var ENZObjectReceive = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectReceive.prototype;

    $this.inlets  = 0;
    $this.outlets = 1;

    $this.initialize = function() {
        this.name = this.args[0] || "";
        this.objectbox.setReceiveObject(this.name, this);
    };

    $this.destroy = function() {
        this.objectbox.removeReceiveObject(this.name, this);
    };
    
    var f = function(inlet, value, event, count) {
        this.send(0, value.value, event, count);
    };
    $this.$bang = $this.$number = $this.$string = $this.$list = f;
    
    return ENZObjectReceive;
}());
enzui({klassName:"receive", klass:ENZObjectReceive,
       abbr: "r",
       whatis:"Receive messages without patch cords",
       category:"enzui.data"});


var ENZObjectSend = (function() {
    var ENZObjectSend = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSend.prototype;

    $this.inlets  = 1;
    $this.outlets = 0;

    $this.initialize = function() {
        this.name = this.args[0] || "";
    };
    
    $this.onstart = function() {
        this._buddies  = this.objectbox.getReceiveObjects(this.name);
        this._curValue = {type:NUMBER, value:0};
    };
    
    
    var f = function(inlet, value, event, count) {
        var i, _buddies, _curValue;
        _buddies  = this._buddies;
        _curValue = this._curValue = value;
        for (i = _buddies.length; i--; ) {
            _buddies[i].send(0, _curValue, event, count);
        }
    };
    $this.$bang = $this.$number = $this.$string = $this.$list = f;
    
    return ENZObjectSend;
}());
enzui({klassName:"send", klass:ENZObjectSend,
       abbr: "s",
       whatis:"Send messages without patch cords",
       category:"enzui.data"});
    
    


    


    


    



var ENZObjectBangBang = (function() {
    var ENZObjectBangBang = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectBangBang.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        var n, w;
        
        n = 1;
        if (!isNaN(this.args[0])) {
            n = this.args[0]|0;
        }

        if (n < 1) n = 1;
        else if (40 < n) n = 40;

        w = n * 10;
        if (w < 80) w = 80;

        this.outlets = n;

        if (this.objectbox.width < w) {
            this.objectbox.width = w;
        }
    };

    $this.$bang = function(inlet, value, event, count) {
        var i;
        for (i = this.outlets; i--; ) {
            this.send(i, value, event, count);
        }
    };
    
    return ENZObjectBangBang;
}());
enzui({klassName:"bangbang", klass:ENZObjectBangBang,
       whatis:"Send a bang to many places, in order",
       category:"enzui.right-to-left"});
    
    
var ENZObjectSwap = (function() {
    var ENZObjectSwap = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSwap.prototype;

    $this.inlets  = 2;
    $this.outlets = 2;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value2 = +this.args[0];
        }
        if (!isNaN(this.args[1])) {
            this.defaults.value1 = +this.args[1];
        }
        if (isNaN(this.defaults.value1)) {
            this.defaults.value1 = 0;
        }
        if (isNaN(this.defaults.value2)) {
            this.defaults.value2 = 0;
        }
    };

    $this.onstart = function() {
        this._value1 = this.defaults.value1;
        this._value2 = this.defaults.value2;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(1, {type:NUMBER, value:this._value2}, event, count);
            this.send(0, {type:NUMBER, value:this._value1}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._value2 = value.value;
            this.send(1, {type:NUMBER, value:this._value2}, event, count);
            this.send(0, {type:NUMBER, value:this._value1}, event, count);
        } else {
            this._value1 = value.value;
        }
    };

    $this.$list = function(inlet, value, event, count) {
        var list, v2, v1;
        if (inlet === 0) {
            list = value.value;
            v2 = list[0];
            if (list.length >= 2) {
                v1 = list[1];
                this._value1 = +v1;
                this._value2 = +v2;
                this.send(1, {type:NUMBER, value:this._value2}, event, count);
                this.send(0, {type:NUMBER, value:this._value1}, event, count);
            }
        }
    };
    
    return ENZObjectSwap;
}());
enzui({klassName:"swap", klass:ENZObjectSwap,
       whatis:"Reverse the sequential order of two integers",
       category:"enzui.right-to-left"});
    
    


    



var ENZObjectInt = (function() {
    var ENZObjectInt = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectInt.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = this.args[0]|0;
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };

    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = value.value|0;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._curValue = value.value|0;
        }
    };
    
    $this.$set = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = value.value|0;
        }
    };

    return ENZObjectInt;
}());
enzui({klassName:"int", klass:ENZObjectInt,
       whatis:"Store an integer value",
       category:"enzui.types"});


var ENZObjectFloat = (function() {
    var ENZObjectFloat = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectFloat.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };

    $this.onstart = function() {
        this._curValue = this.defaults.value;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = +value.value;
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        } else {
            this._curValue = +value.value;
        }
    };
    
    $this.$set = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._curValue = +value.value;
        }
    };

    return ENZObjectFloat;
}());
enzui({klassName:"float", klass:ENZObjectFloat,
       whatis:"Store an float value",
       category:"enzui.types"});
    
    
var ENZObjectPrint = (function() {
    var ENZObjectPrint = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectPrint.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 0;
    
    $this.initialize = function() {
        this._id = this.args[0] || "print";
    };
    
    $this.$bang = function(inlet, value, event, count) {
        console.log(this._id + ": BANG");
    };
    
    $this.$number = $this.$string = function(inlet, value, event, count) {
        console.log(this._id + ":", value.value);
    };

    $this.$list = function(inlet, value, event, count) {
        var s;
        s = value.value.join(" ");
        console.log(this._id + ":", s);
    };
    
    return ENZObjectPrint;
}());
enzui({klassName:"print", klass:ENZObjectPrint,
       whatis:"Print any message in the console",
       category:"enzui.system"});


var ENZObjectRunBang = (function() {
    var ENZObjectRunBang = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectRunBang.prototype;
    
    $this.inlets  = 0;
    $this.outlets = 1;
    $this.forecolor = "#cc6633";
    $this.backcolor = "#ffeeee";
    
    $this.onstart = function() {
        this.send(0, {type:BANG});
    };
    
    return ENZObjectRunBang;
}());
enzui({klassName:"runbang", klass:ENZObjectRunBang,
       whatis:"Send a bang automatically when a patcher is run",
       category:"enzui.system"});





var ENZObjectDelay = (function() {
    var ENZObjectDelay = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectDelay.prototype;

    $this.inlets    = 2;
    $this.outlets   = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.delayMsec = +this.args[0];
        }

        if (isNaN(this.defaults.delayMsec)) {
            this.defaults.delayMsec = 0;
        }
    };

    $this.onstart = function() {
        this._on = false;
        this._delayMsec = this.defaults.delayMsec;
        this._delaySamples = 0;
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._on = true;
            this._delaySamples = (this.SAMPLERATE * this._delayMsec / 1000)|0;
        }
    };

    $this.$number = function(inlet, value, event, count) {
        var v = value.value|0;
        if (inlet === 0) {
            if (this._on) {
                this._delaySamples += (this.SAMPLERATE * v / 1000)|0;
            }
        } else {
            this._delayMsec = v;
        }
    };
    
    
    $this.oninterval = function(samples) {
        if (this._on) {
            this._delaySamples -= samples;
            if (this._delaySamples <= 0) {
                this.send(0, {type:BANG});
                this._on = false;
            }
        }
    };
    
    return ENZObjectDelay;
}());
enzui({klassName:"delay", klass:ENZObjectDelay,
       whatis:"Delay a bang before passing it on.",
       category:"enzui.timing"});
    
    
var ENZObjectMetro = (function() {
    var ENZObjectMetro = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectMetro.prototype;
    
    $this.inlets    = 2;
    $this.outlets   = 1;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.metroMsec = +this.args[0];
        }
        
        if (isNaN(this.defaults.metroMsec)) {
            this.defaults.metroMsec = 5;
        }

        if (this.defaults.metroMsec < 5) {
            this.defaults.metroMsec = 5;
        }
    };

    $this.onstart = function() {
        this._on = false;
        this._metroSamples = this.SAMPLERATE * this.defaults.metroMsec / 1000;
        this._metroCount   = 0;
    };
    
    $this.$color = function(inlet, value, event, count) {
        this.color = value.value;
    };

    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._on = true;
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        var msec;
        if (inlet === 0) {
            this._on = !!value.value;
        } else {
            msec = value.value;
            if (msec < 5) msec = 5;
            this._metroSamples = this.SAMPLERATE * msec / 1000;
        }
    };

    $this.$stop = function(inlet, value, event, count) {
        if (inlet === 0) {
            this._on = false;
        }
    };

    $this.oninterval = function(samples) {
        this._metroCount -= samples;
        if (this._metroCount <= 0) {
            if (this._on) this.send(0, {type:BANG});
            this._metroCount += this._metroSamples;
        }
    };
    
    return ENZObjectMetro;
}());
enzui({klassName:"metro", klass:ENZObjectMetro,
       whatis:"Output a bang message at regular intervals",
       category:"enzui.timing"});
    



    
var ENZObjectButton = (function() {
    var ENZObjectButton = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectButton.prototype;
    
    $this.inlets    = 1;
    $this.outlets   = 1;
    $this.backcolor = "lightgray";
    
    $this.initialize = function() {
        this._color = "gray";
        this._blink = 0;
    };
    
    $this.onstart = function() {
        this._blink = 0;
        this._prevValue = null;
    };
    
    $this.onresize = function() {
        this.objectbox.width = this.objectbox.height = 20;
    };

    var f = function(inlet, value, event, count) {
        this._blink = +new Date();
        this.send(0, {type:BANG}, event, count);
    }; 
    $this.$bang = $this.$number = $this.$list = $this.$string = f;
    
    $this.$color = function(inlet, value, event, count) {
        this._color = value;
    };
    
    $this.onmousedown = function(x, y) {
        this._blink = +new Date();
        this.send(0, {type:BANG});
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var color;
        color = ((+new Date() - this._blink) < 80);
        if (color !== this._prevValue) {
            this._prevValue = color;
            color = color ? "yellow" : this._color;
            painter.rect(x, y, w, h, "dimgray", this.backcolor);
            painter.arc(x + 10, y + 10, 6, null, color);
        }
    };
    
    return ENZObjectButton;
}());
enzui({klassName:"button", klass:ENZObjectButton,
       abbr:"b:",
       whatis:"Flash on any message, send a bang",
       category:"enzui.ui"});


var ENZObjectDial = (function() {
    var ENZObjectDial = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectDial.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;
    $this.minWidth  = 60;
    $this.minHeight = 60;
    $this.backcolor = "lightgray";
    $this.needlecolor = "dimgray";
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
        
        if (isNaN(this.defaults.size)) {
            this.defaults.size = 128;
        } else {
            this.defaults.size |= 0;
        }
        
        if (isNaN(this.defaults.min)) {
            this.defaults.min = 0;
        } else {
            this.defaults.min |= 0;
        }
        
        if (isNaN(this.defaults.mult)) {
            this.defaults.mult = 1;
        } else {
            this.defaults.mult |= 0;
        }
        
        if (isNaN(this.defaults.border)) {
            this.defaults.border = 1;
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
        this._prev = null;
        this._size = this.defaults.size;
        this._min  = this.defaults.min;
        this._mult = this.defaults.mult;
        this._eventId = 0;
        this._x = this._y = 0;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var v;
        v = value.value|0;
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        this._curValue = v;
        v = v * this._mult + this._min;
        this.send(0, {type:NUMBER, value:v}, event, count);
    };
    
    $this.onmousedown = function(x, y, dx, dy) {
        var v;
        v = this._curValue * this._mult + this._min;
        this._eventId = (+new Date() * 100 + Math.random() * 100)|0;
        this.send(0, {type:NUMBER, value:v}, this._eventId);
    };
    
    $this.onmousemove = function(x, y, dx, dy) {
        var v;
        
        v = this._curValue - dy;
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        this._curValue = v;
        v = v * this._mult + this._min;
        this.send(0, {type:NUMBER, value:v}, this._eventId);
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var r, x1, radius, x2, y1, y2;
        if (this._curValue !== this._prev) {
            if (this.defaults.border) {
                painter.rect(x, y, w, h, this.forecolor, this.backcolor);
            } else {
                painter.rect(x, y, w, h, null, this.backcolor);
            }

            radius  = w/2-5;
            x1 = x+w/2;
            y1 = y+h/2;
            
            painter.arc(x1, y1, radius, null, "white");
            r = (this._curValue / this._size);
            
            x2 = Math.sin(-(r * 5.654866776 + 0.314159265)) * radius;
            y2 = Math.cos( (r * 5.654866776 + 0.314159265)) * radius;
            
            painter.drawtheline(x1, y1, x1+x2, y1+y2, this.needlecolor);
            
            this._prev = this._curValue;
        }
    };
    
    return ENZObjectDial;
}());
enzui({klassName:"dial", klass:ENZObjectDial,
       whatis:"Output numbers by moving a dial onscreen",
       category:"enzui.ui"});


var ENZObjectNumber = (function() {
    var ENZObjectNumber = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectNumber.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;
    
    $this.initialize = function() {
        var n;
        this._floatType = false;
        
        if (!isNaN(this.args[0])) {
            if (this.args[0].indexOf(".") !== -1) {
                this._floatType = true;
            }
            this.defaults.value = +this.args[0];
        }
        
        if (this.defaults.type === "float") {
            this._floatType = true;
        }
        
        if (this._floatType) {
            this._caps   = "f: ";
            this._cast   = $this.castFLOAT;
            if (this.defaults.digits) {
                n = +this.defaults.digits;
                if (n < 2) n = 2;
            } else {
                n = 2;
            }
            this._format = function(v) { return v.toFixed(n); };
        } else {
            this._caps   = "n: ";
            this._cast   = $this.castINT;
            this._format = $this._formatINT;
        }
        
        
        if (isNaN(this.defaults.min)) {
            this.defaults.min = -Infinity;
        } else {
            this.defaults.min = this._cast(this.defaults.min);
        }

        if (isNaN(this.defaults.max)) {
            this.defaults.max = +Infinity;
        } else {
            this.defaults.max = this._cast(this.defaults.max);
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
        
        this.defaults.value = this._cast(this.defaults.value);
        if (this.defaults.value < this.defaults.value) {
            this.defaults.value = this.defaults.min;
        } else if (this.defaults.max < this.defaults.value) {
            this.defaults.value = this.defaults.max;
        }
        
        this._curValue  = this.defaults.value;
        this._prevValue = null;
        
        this._eventId = 0;
        
        this.str = this._caps + this._format(this._curValue);
    };
    
    $this.onstart = function() {
        this._curValue  = this.defaults.value;
        this._minValue  = this.defaults.min;
        this._maxValue  = this.defaults.max;
        this._prevValue = null;
        this._eventId = 0;
        // this.send(0, {type:NUMBER, value:this._curValue});
    };
    
    $this.$bang = function(inlet, value, event, count) {
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        var v;
        v = value.value;
        if (v < this._minValue) v = this._minValue;
        else if (this._maxValue < v) v = this._maxValue;
        this._curValue = this._cast(v);
        if (inlet === 0) {
            this.send(0, {type:NUMBER, value:this._curValue}, event, count);
        }
    };
    
    $this.$set = function(inlet, value, event, count) {
        var v;
        if (inlet === 0) {
            v = value.value;
            if (v < this._minValue) v = this._minValue;
            else if (this._maxValue < v) v = this._maxValue;
            this._curValue = this._cast(v);
        }
    };
    
    $this.$max = function(inlet, value, event, count) {
        if (!isNaN(value)) {
            this._maxValue = this._cast(value);
        }
    };

    $this.$min = function(inlet, value, event, count) {
        if (!isNaN(value)) {
            this._minValue = this._cast(value);
        }
    };
    
    $this.onmousedown = function(x, y) {
        this._eventId = (+new Date() * 100 + Math.random() * 100)|0;
    };
    
    $this.onmousemove = function(x, y, dx, dy) {
        var value = this._curValue;
        if (this._floatType) {
            if (this.objectbox.x + this.objectbox.width / 2 < x) {
                dy /= 100;
            }
        }
        value = value - dy;
        if (value < this._minValue) value = this._minValue;
        else if (this._maxValue < value) value = this._maxValue;
        this._curValue = this._cast(value);
        this.send(0, {type:NUMBER, value:this._curValue}, this._eventId);
    };
    
    $this.onmouseup = function(x, y) {
        this.send(0, {type:NUMBER, value:this._curValue}, this._eventId);
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var path, color, str, width, _x;

        if (this._curValue !== this._prevValue) {
            painter.rect(x, y, w, h, "dimgray", this.backcolor);
            path = [x, y, x+10, y+h/2, x, y+h];
            color = "lightgray";
            if (this.objectbox.selected.selected) {
                color = "lime";
            }
            str = this._format(this._curValue);
            width = painter.measureText(str).width;
            _x = x + w - width;
            if (_x < x + 12) _x = x + 12;
            painter.path(path, "dimgray", 1, color);
            painter.text(this._format(this._curValue), _x, y + 4, w-12, h, "black");
            this._prevValue = this._curValue;
        }
    };

    $this._formatINT = function(v) {
        return v;
    };
    
    $this._formatFLOAT = function(v) {
        return v.toFixed(2);
    };
    
    return ENZObjectNumber;
}());
enzui({klassName:"number", klass:ENZObjectNumber,
       abbr:"n: i: f:",
       whatis:"Display and output a number",
       category:"enzui.ui"});
    
    
var ENZObjectToggle = (function() {
    var ENZObjectToggle = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectToggle.prototype;

    $this.inlets    = 1;
    $this.outlets   = 1;
    $this.backcolor = "lightgray";
    
    $this.initialize = function() {
        if (this.args.length) {
            if (!isNaN(this.args[0])) {
                this.defaults.value = +this.args[0];
            }
        }
        
        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
        
        this._curValue  = this.defaults.value;
        this._prevValue = null;
        
        if (this._curValue) {
            this.str = "t:X";
        } else {
            this.str = "t: ";
        }
    };
    
    $this.onstart = function() {
        this._curValue  = this.defaults.value;
        this._prevValue = null;
        this.send(0, {type:NUMBER, value:this._curValue});
    };
    
    $this.onresize = function() {
        this.objectbox.width = this.objectbox.height = 20;
    };

    $this.$bang = function(inlet, value, event, count) {
        this._curValue = 1 - this._curValue;
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
    };

    $this.$number = function(inlet, value, event, count) {
        this._curValue = (value.value !== 0) ? 1 : 0;
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
    };

    $this.$set = function(inlet, value, event, count) {
        if (value.value && !isNaN(value.value)) {
            this._curValue = (value.value !== 0) ? 1 : 0;
        }
    };
    
    $this.onmousedown = function(x, y) {
        $this.$bang.call(this);
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        if (this._curValue !== this._prevValue) {
            painter.rect(x, y, w, h, "dimgray", this.backcolor);
            if (this._curValue) {
                painter.drawtheline(x+2, y+2, x+w-2, y+h-2);
                painter.drawtheline(x+w-2, y+2, x+2, y+h-2);
            }
            this._prevValue = this._curValue;
        }
    };
    
    return ENZObjectToggle;
}());
enzui({klassName:"toggle", klass:ENZObjectToggle,
       abbr:"t:",
       whatis:"Switch between off and on (0 and 1)",
       category:"enzui.ui"});
    

var ENZObjectLED = (function() {
    var ENZObjectLED = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectLED.prototype;
    
    $this.inlets    = 1;
    $this.outlets   = 1;
    $this.backcolor = "lightgray";

    var LEDColor = [
        // border    off        on
        ["#990000", "#663333", "#ff0000"], // 0 .. red
        ["#009900", "#336633", "#00ff00"], // 1 .. green
        ["#000099", "#333366", "#6666ff"], // 2 .. blue
        ["#999900", "#666633", "#ffff99"], // 3 .. yellow
        ["#999999", "#666666", "#ffffff"]  // 4 .. white
    ];
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.color = +this.args[0];
        }

        if (isNaN(this.defaults.color)) {
            this.defaults.color = 0;
        }
        
        this._curValue  = 0;
        this._prevValue = null;
        this._LEDColor  = LEDColor[this.defaults.color];
    };
    
    $this.onstart = function() {
        this._curValue  = 0;
        this._prevValue = null;
        this._LEDColor  = LEDColor[this.defaults.color];
        // this.send(0, {type:NUMBER, value:this._curValue});
    };
    
    $this.onresize = function() {
        this.objectbox.width = this.objectbox.height = 20;
    };

    $this.$bang = function(inlet, value, event, count) {
        this._curValue = 1 - this._curValue;
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
    };

    $this.$number = function(inlet, value, event, count) {
        this._curValue = (value.value !== 0) ? 1 : 0;
        this.send(0, {type:NUMBER, value:this._curValue}, event, count);
    };

    $this.$set = function(inlet, value, event, count) {
        if (value.value && !isNaN(value.value)) {
            this._curValue = (value.value !== 0) ? 1 : 0;
        }
    };

    $this.onmousedown = function(x, y) {
        $this.$bang.call(this);
    };

    $this.onanimate = function(painter, x, y, w, h) {
        var strokecolor, fillcolor;
        if (this._curValue !== this._prevValue) {
            painter.rect(x, y, w, h, "dimgray", this.backcolor);

            strokecolor = this._LEDColor[0];
            fillcolor   = this._LEDColor[1+this._curValue];
            
            painter.save();
            painter.lineWidth = 2;
            painter.arc(x + 10, y + 10, 6, strokecolor, fillcolor);
            painter.restore();

            this._prevValue = this._curValue;
        }
    };

    return ENZObjectLED;
}());
enzui({klassName:"led", klass:ENZObjectLED,
       abbr:"l:",
       whatis:"Display on/off status in color",
       category:"enzui.ui"});


var ENZObjectIncDec = (function() {
    var ENZObjectIncDec = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectIncDec.prototype;

    $this.inlets    = 1;
    $this.outlets   = 1;
    $this.backcolor = "lightgray";

    $this.initialize = function() {
        this._curValue  = 0;
        this._mouseDown = 0x00;
        this._prevMouseDown  = null;
        this._mouseDownCount = 0;
        this._eventId = 0;
        this._mouseDownCountMax1st = this.SAMPLERATE * 0.50;
        this._mouseDownCountMax2nd = this.SAMPLERATE * 0.10;
        this._mouseDownCountMax3rd = this.SAMPLERATE * 0.01;
    };
    
    $this.onstart = function() {
        this._curValue  = 0;
        this._mouseDown = 0x00; // 0..none 1..up 2..down
        this._prevMouseDown  = null;
        this._mouseDownCount = 0;
        this._eventId = 0;
    };
    
    $this.onresize = function() {
        this.objectbox.width = this.objectbox.height = 20;
    };
    
    $this.$number = function(inlet, value, event, count) {
        this._curValue = value.value|0;
    };
    
    $this.onmousedown = function(x, y) {
        if (y < this.objectbox.y + this.objectbox.height / 2) {
            this._mouseDown = 0x01;
        } else {
            this._mouseDown = 0x02;
        }
        this._eventId = +new Date();
        this._mouseDownCountMax = this._mouseDownCountMax1st;
    };

    $this.oninterval = function(samples) {
        if (this._mouseDown) {
            this._mouseDownCount -= samples;
            if (this._mouseDownCount <= 0) {
                if (this._mouseDown === 0x01) {
                    this._curValue += 1;
                } else {
                    this._curValue -= 1;
                }
                if (this._mouseDownCountMax !== this._mouseDownCountMax3rd) {
                    if (this._mouseDownCountMax === this._mouseDownCountMax1st) {
                        this._mouseDownCountMax = this._mouseDownCountMax2nd;
                    } else  {
                        this._mouseDownCountMax *= 0.9;
                        if (this._mouseDownCountMax < this._mouseDownCountMax3rd) {
                            this._mouseDownCountMax = this._mouseDownCountMax3rd;
                        }
                    }
                }
                this._mouseDownCount += this._mouseDownCountMax;
                this.send(0, {type:NUMBER, value:this._curValue}, this._eventId);
            }
        }
    };
    
    $this.onmouseup = function(x, y) {
        this._mouseDown = 0x00;
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var path, centerY, color;
        if (this._curValue !== this._prevMouseDown) {
            painter.rect(x, y, w, h, "dimgray", this.backcolor);
        
            centerY = y + h / 2;
        
            path = [x+h/2, y+2, x+w-4, centerY-2, x+4, centerY-2];
            color = (this._mouseDown === 0x01) ? "lime" : "dimgray";
            painter.path(path, "dimgray", 1, color);
            painter.drawtheline(x, centerY, x+w, centerY, "dimgray");
            path = [x+h/2, y+h-2, x+w-4, centerY+2, x+4, centerY+2];
            color = (this._mouseDown === 0x02) ? "lime" : "dimgray";
            painter.path(path, "dimgray", 1, color);
        
            this._prevMouseDown = this._mouseDown;
        }
    };    
    
    return ENZObjectIncDec;
}());
enzui({klassName:"incdec", klass:ENZObjectIncDec,
       whatis:"Buttons that increment/decrement a value",
       category:"enzui.ui"});
    

var ENZObjectLCD = (function() {
    var ENZObjectLCD = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectLCD.prototype;

    $this.inlets  = 1;
    $this.outlets = 3;
    
    $this.initialize = function() {
        this._canvas = document.createElement("canvas");
        this._canvas.width  = this.objectbox.width;
        this._canvas.height = this.objectbox.height;
        this._context = this._canvas.getContext("2d");

        if (isNaN(this.defaults.border)) {
            this.defaults.border = 0;
        }
        this.defaults.color = this.defaults.color || "black";
        this.defaults.brgb  = this.defaults.brgb  || "white";
    };
    
    $this.onstart = function() {
        this._border = this.defaults.border;
        this._color  = this.defaults.color;
        this._brgb   = this.defaults.brgb;
    };
    
    $this.$border = function(inlet, value, event, count) {
        this._border = (value.value) ? 1 : 0;
    };
    
    $this.$brgb = function(inlet, value, event, count) {
        this._brgb = value.value;
    };

    $this.$color = function(inlet, value, event, count) {
        this._color = value.value;
    };
    
    $this.$clear = function(inlet, value, event, count) {
        this._context.fillStyle = this._brgb;
        this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
    };
    
    $this.$paintoval = function(inlet, value, event, count) {
        var items;
        var left, top, right, bottom;
        var hw, hh, x0, y1, cw, ch;
        var c;

        items = value.value.split(/\s+/);
        left   = (items[0]|0) || 0;
        top    = (items[1]|0) || 0;
        right  = (items[2]|0) || 0;
        bottom = (items[3]|0) || 0;
        
        hw = (right - left) / 2.0;
        hh = (bottom - top) / 2.0;
        x0 = left + hw;
        y1 = top  + hh;
        
        c = this._context;
        
        c.beginPath();
        cw = 4.0 * (Math.sqrt(2.0) - 1.0) * hw / 3.0;
        ch = 4.0 * (Math.sqrt(2.0) - 1.0) * hh / 3.0;
        c.moveTo(x0, top);
        c.bezierCurveTo(x0 + cw, top, right, y1 - ch, right, y1);
        c.bezierCurveTo(right, y1 + ch, x0 + cw, bottom, x0, bottom);
        c.bezierCurveTo(x0 - cw, bottom, left, y1 + ch, left, y1);
        c.bezierCurveTo(left, y1 - ch, x0 - cw, top, x0, top);
        c.closePath();
        c.fillStyle = this._color;
        c.fill();
    };
    
    $this.draw = function(painter, x, y, w, h) {
        if (this.defaults.border) {
            painter.rect(x, y, w, h, this.forecolor, this.defaults.brgb);
        } else {
            painter.rect(x, y, w, h, null, this.defaults.brgb);
        }
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        painter.drawImage(this._canvas, x, y, w, h);
        if (this._border) {
            painter.rect(x, y, w, h, this.forecolor);
        }
    };
    
    return ENZObjectLCD;
}());
enzui({klassName:"lcd", klass:ENZObjectLCD,
       whatis:"Draw graphics in a patcher window",
       category:"enzui.ui"});


var ENZObjectRangeSlider = (function() {
    var ENZObjectRangeSlider = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectRangeSlider.prototype;

    $this.inlets  = 2;
    $this.outlets = 2;
    
    $this.initialize = function() {
        if (isNaN(this.defaults.size)) {
            this.defaults.size = 128;
        } else {
            this.defaults.size |= 0;
        }
        
        if (isNaN(this.defaults.min)) {
            this.defaults.min = 0;
        } else {
            this.defaults.min |= 0;
        }
        
        if (isNaN(this.defaults.mult)) {
            this.defaults.mult = 1;
        } else {
            this.defaults.mult |= 0;
        }

        if (isNaN(this.defaults.orientation)) {
            this.defaults.orientation = 0;
        } else {
            this.defaults.orientation |= 0;
        }
        
        if (this.defaults.orientation !== 1 || this.defaults.orientation !== 2) {
            if (this.objectbox.width >= this.objectbox.height) {
                this.defaults.orientation = 1; // horizotal
            } else {
                this.defaults.orientation = 2; // vertical
            }
        }
        
        if (this.defaults.orientation === 1) {
            this.minWidth  = 130;
            this.minHeight = 20;
        } else {
            this.minWidth  = 20;
            this.minHeight = 130;
        }
        
        if (isNaN(this.defaults.absolute)) {
            this.defaults.absolute = 0;
        } else {
            this.defaults.absolute |= 0;
        }

        if (!this.defaults.knobcolor) {
            this.defaults.knobcolor = "#666";    
        }
        
        if (isNaN(this.defaults.border)) {
            this.defaults.border = 1;
        }
    };
    
    $this.onstart = function() {
        this._prev1 = this._prev2 = null;
        this._size = this.defaults.size;
        this._min  = this.defaults.min;
        this._mult = this.defaults.mult;
        this._orientation = this.defaults.orientation;
        this._absolute = this.defaults.absolute;
        this._knobcolor = this.defaults.knobcolor;
        this._eventId = 0;
        this._mouseDown = 0;
        this._mouseDownCount = this._mouseDownCountMax = this.SAMPLERATE * 0.1;
        this._x = this._y = 0;
        this._curValue1 = 0;
        this._curValue2 = this._size;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var v, v1, v2;
        v = value.value|0;
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        if (inlet === 0) {
            if (this._curValue2 < v) {
                v = this._curValue2;
            }
            this._curValue1 = v;
        } else {
            if (v < this._curValue1) {
                v = this._curValue1;
            }
            this._curValue2 = v;
        }
        this.send(1, {type:NUMBER, value:this._curValue2 * this._mult + this._min}, event, count);
        this.send(0, {type:NUMBER, value:this._curValue1 * this._mult + this._min}, event, count);
    };
    
    $this.onmousedown = function(x, y, dx, dy) {
        var r, v;
        
        if (this._orientation === 1) {
            // horizontal
            x -= this.objectbox.x;
            this._x = x;
            r = (x / this.objectbox.width);
        } else {
            // vertical
            y -= this.objectbox.y;
            this._y = y;
            r = 1.0 - (y / this.objectbox.height);
        }
        v = (this._size * r) | 0;
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        
        if (Math.abs(v - this._curValue1) < Math.abs(v - this._curValue2)) {
            this._curValue1 = v;
        } else {
            this._curValue2 = v;
        }
        this._eventId = +new Date();
        this.send(1, {type:NUMBER, value:this._curValue2 * this._mult + this._min}, this._eventId);
        this.send(0, {type:NUMBER, value:this._curValue1 * this._mult + this._min}, this._eventId);
        this._mouseDown = 1;
    };
    
    $this.onmousemove = function(x, y, dx, dy) {
        var r, v;
        if (this._orientation === 1) {
            // horizontal
            x -= this.objectbox.x;
            this._x = x;
            r = (x / this.objectbox.width);
        } else {
            // vertical
            y -= this.objectbox.y;
            this._y = y;
            r = 1.0 - (y / this.objectbox.height);
        }
        v = (this._size * r) | 0;
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        
        if (Math.abs(v - this._curValue1) < Math.abs(v - this._curValue2)) {
            this._curValue1 = v;
        } else {
            this._curValue2 = v;
        }
        this.send(1, {type:NUMBER, value:this._curValue2 * this._mult + this._min}, this._eventId);
        this.send(0, {type:NUMBER, value:this._curValue1 * this._mult + this._min}, this._eventId);
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var r1, r2, p0, p1, p2;
        
        if (this._curValue1 !== this._prev1 || this._curValue2 !== this._prev2) {
            painter.rect(x, y, w, h, this.forecolor, this.backcolor);
            painter.drawtheline(x, y+h/2, x+w, y+h/2, this.forecolor);
            
            if (this._orientation === 1) {
                // horizontal
                r1 = (this._curValue1 / this._size);
                r2 = (this._curValue2 / this._size);
                p1 = (r1 * w + x)|0;
                p0 = (p1 - 2)|0;
                p1 = (r2 * w + x)|0;
                p2 = (p1 + 2)|0;
                if (p0  < x+2) {
                    p0 = x+2;
                }
                if (x+w-2 < p2) {
                    p2 = x+w-2;
                }
                painter.rect(p0, y+2, p2-p0, h-4, this.forecolor, this._knobcolor);
            } else {

                // vertical
                r1 = 1.0 - (this._curValue1 / this._size);
                r2 = (this._curValue2 / this._size);
                p1 = (r1 * h + y)|0;
                p0 = p1 - 2;
                p1 = (r2 * h + y)|0;
                p2 = p1 + 2;
                if (p0  < y+2) {
                    p0 = y+2;
                    p2 = p0 + 4;
                }
                if (y+h-2 < p2) {
                    p2 = y+h-2;
                    p0 = p2 - 4;
                }
                painter.rect(x+2, p0, w-4, p2-p0, this.forecolor, this._knobcolor);
            }
            this._prev1 = this._curValue1;
            this._prev2 = this._curValue2;
        }
    };
    
    return ENZObjectRangeSlider;
}());
enzui({klassName:"rslider", klass:ENZObjectRangeSlider,
       whatis:"Display or change a range of numbers",
       category:"enzui.ui"});


var ENZObjectSlider = (function() {
    var ENZObjectSlider = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectSlider.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }

        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
        
        if (isNaN(this.defaults.size)) {
            this.defaults.size = 128;
        } else {
            this.defaults.size |= 0;
        }
        
        if (isNaN(this.defaults.min)) {
            this.defaults.min = 0;
        } else {
            this.defaults.min |= 0;
        }
        
        if (isNaN(this.defaults.mult)) {
            this.defaults.mult = 1;
        } else {
            this.defaults.mult |= 0;
        }

        if (isNaN(this.defaults.orientation)) {
            this.defaults.orientation = 0;
        } else {
            this.defaults.orientation |= 0;
        }
        
        if (this.defaults.orientation !== 1 || this.defaults.orientation !== 2) {
            if (this.objectbox.width >= this.objectbox.height) {
                this.defaults.orientation = 1; // horizotal
            } else {
                this.defaults.orientation = 2; // vertical
            }
        }
        
        if (this.defaults.orientation === 1) {
            this.minWidth  = 30;
            this.minHeight = 20;
        } else {
            this.minWidth  = 20;
            this.minHeight = 130;
        }
        
        if (isNaN(this.defaults.absolute)) {
            this.defaults.absolute = 0;
        } else {
            this.defaults.absolute |= 0;
        }

        if (!this.defaults.knobcolor) {
            this.defaults.knobcolor = "#666";    
        }
    };
    
    $this.onstart = function() {
        this._curValue = this.defaults.value;
        this._prev = null;
        this._size = this.defaults.size;
        this._min  = this.defaults.min;
        this._mult = this.defaults.mult;
        this._orientation = this.defaults.orientation;
        this._absolute = this.defaults.absolute;
        this._knobcolor = this.defaults.knobcolor;
        this._eventId = 0;
        this._mouseDown = 0;
        this._mouseDownCount = this._mouseDownCountMax = this.SAMPLERATE * 0.1;
        this._x = this._y = 0;
        this._catch = 0;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var v;
        v = value.value|0;
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        this._curValue = v;
        v = v * this._mult + this._min;
        this.send(0, {type:NUMBER, value:v}, event, count);
    };
    
    $this.onmousedown = function(x, y, dx, dy) {
        var r, v, _x;
        
        if (this._orientation === 1) {
            // horizontal
            x -= this.objectbox.x;
            this._x = x;
            r = (x / this.objectbox.width);
        } else {
            // vertical
            y -= this.objectbox.y;
            this._y = y;
            r = 1.0 - (y / this.objectbox.height);
        }
        v = (this._size * r) | 0;
        
        _x = this.objectbox.width * (this._curValue / this._size);
        if (Math.abs(x - _x) <= 6) {
            this._catch = 1;
        } else {
            this._catch = 0;
        }
        
        if (!this._catch && !this._absolute) {
            if (v < this._curValue) {
                v = this._curValue - 1;
            } else if (this._curValue < v) {
                v = this._curValue + 1;
            }
        }
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        this._curValue = v;
        v = v * this._mult + this._min;
        this._eventId = +new Date();
        this.send(0, {type:NUMBER, value:v}, this._eventId);
        this._mouseDown = 1;
    };
    
    $this.onmousemove = function(x, y, dx, dy) {
        var r, v;
        if (this._orientation === 1) {
            // horizontal
            x -= this.objectbox.x;
            this._x = x;
            r = (x / this.objectbox.width);
        } else {
            // vertical
            y -= this.objectbox.y;
            this._y = y;
            r = 1.0 - (y / this.objectbox.height);
        }
        if (!this._catch && !this._absolute) {
            return;
        }
        v = (this._size * r) | 0;
        
        if (v < 0) {
            v = 0;
        } else if (this._size < v) {
            v = this._size;
        }
        this._curValue = v;
        v = v * this._mult + this._min;
        this.send(0, {type:NUMBER, value:v}, this._eventId);
        this._mouseDownCount = this._mouseDownCountMax;
    };
    
    $this.onmouseup = function(x, y) {
        this._mouseDown = 0;
    };

    $this.oninterval = function(samples) {
        var x, y, r, v;
        if (this._mouseDown) {
            this._mouseDownCount -= samples;
            if (this._mouseDownCount <= 0) {
                if (this._orientation === 1) {
                    // horizontal
                    x = this._x;
                    this._x = x;
                    r = (x / this.objectbox.width);
                } else {
                    // vertical
                    y = this._y;
                    r = 1.0 - (y / this.objectbox.height);
                }
                v = (this._size * r) | 0;
                if (!this._catch && !this._absolute) {
                    if (v < this._curValue) {
                        v = this._curValue - 1;
                        } else if (this._curValue < v) {
                            v = this._curValue + 1;
                        }
                }
                if (v < 0) {
                    v = 0;
                } else if (this._size < v) {
                    v = this._size;
                }
                this._curValue = v;
                v = v * this._mult + this._min;
                this.send(0, {type:NUMBER, value:v}, this._eventId);
                this._mouseDownCount += this._mouseDownCountMax;
            }
        }
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var r, p0, p1, p2;
        if (this._curValue !== this._prev) {
            painter.rect(x, y, w, h, this.forecolor, this.backcolor);
            
            if (this._orientation === 1) {
                // horizontal
                r = (this._curValue / this._size);
                p1 = (r * w + x)|0;
                p0 = p1 - 2;
                p2 = p1 + 2;
                if (p0  < x+2) {
                    p0 = x+2;
                    p2 = p0 + 4;
                }
                if (x+w-2 < p2) {
                    p2 = x+w-2;
                    p0 = p2 - 4;
                }
                painter.rect(p0, y+2, p2-p0, h-4, this.forecolor, this._knobcolor);
            } else {
                // vertical
                r = 1.0 - (this._curValue / this._size);
                p1 = (r * h + y)|0;
                p0 = (p1 - 2)|0;
                p2 = (p1 + 2)|0;
                if (p0  < y+2) {
                    p0 = y+2;
                    p2 = p0 + 4;
                }
                if (y+h-2 < p2) {
                    p2 = y+h-2;
                    p0 = p2 - 4;
                }
                painter.rect(x+2, p0, w-4, p2-p0, this.forecolor, this._knobcolor);
            }
            this._prev = this._curValue;
        }
    };
    
    return ENZObjectSlider;
}());
enzui({klassName:"slider", klass:ENZObjectSlider,
       whatis:"Output numbers by moving a slider onscreen",
       category:"enzui.ui"});


var ENZObjectComment = (function() {
    var ENZObjectComment = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectComment.prototype;

    $this.initialize = function() {
        this.str = this.args.join(" ");
    };
    
    $this.draw = function(painter, x, y, w, h, animate) {
        painter.text(this.toString(), x+2, y+2, w-4, h-4, this.forecolor);
    };
    
    return ENZObjectComment;
}());
enzui({klassName:"comment", klass:ENZObjectComment,
       abbr: "c:",
       whatis:"Explanatory note or label",
       category:"enzui.ui"});
    




    
var ENZObjectTarai = (function() {
    var ENZObjectTarai = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectTarai.prototype;
    
    $this.inlets    = 4;
    $this.outlets   = 2;
    
    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.x = this.args[0]|0;
        }
        if (!isNaN(this.args[1])) {
            this.defaults.y = this.args[1]|0;
        }
        if (!isNaN(this.args[2])) {
            this.defaults.z = this.args[2]|0;
        }
        
        if (isNaN(this.defaults.x)) {
            this.defaults.x = 0;
        }
        if (isNaN(this.defaults.y)) {
            this.defaults.y = 0;
        }
        if (isNaN(this.defaults.z)) {
            this.defaults.z = 0;
        }
        if (isNaN(this.defaults.limit)) {
            this.defaults.limit = 100000;
        }
    };
    
    $this.onstart = function() {
        this._xyz = [ this.defaults.x, this.defaults.y, this.defaults.z ];
        calc.call(this, this.defaults.x, this.defaults.y, this.defaults.z);
        this._index    = 0;
        this._finished = false;
    };

    $this.$bang = function(inlet, value, event, count) {
        var _list, _index, v, result;
        
        if (!this._finished) {
            _list  = this._list;
            _index = this._index;
            result = [ _list[_index++], _list[_index++], _list[_index++] ];
            this._index = _index;
            
            if (_list.length <= _index) {
                this.send(1, {type:BANG}, event, count);
                this._finished = true;
            }
            
            this.send(0, {type:LIST, value:result}, event, count);
        }
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet > 0) {
            this._xyz[inlet-1] = value.value|0;
        }
    };

    $this.$reset = function(inlet, value, event, count) {
        calc.call(this, this._xyz[0], this._xyz[1], this._xyz[2]);
        this._index    = 0;
        this._finished = false;
    };
    
    var calc = function(x, y, z) {
        var _list  = this._list  = [];
        var _limit = this.defaults.limit * 3;
        function tarai(x, y, z) {
            if (_list.length >= _limit) {
                return Infinity;
            }
            _list.push(x|0, y|0, z|0);
            if (x <= y) {
                return y;
            } else {
                return tarai(tarai(x-1,y,z), tarai(y-1,z,x), tarai(z-1,x,y));
            }
        }
        tarai(x, y, z);
        this._finished = false;
    };
    
    return ENZObjectTarai;
}());
enzui({klassName:"tarai", klass:ENZObjectTarai,
       whatis:"TakFunction",
       category:"enzui.demo"});


var ENZObjectEZKeyboard = (function() {
    var ENZObjectEZKeyboard = function() {
        this.initialize.apply(this, arguments);
    }, $this = ENZObjectEZKeyboard.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        if (!isNaN(this.args[0])) {
            this.defaults.octave = this.args[0]|0;
        }

        if (isNaN(this.defaults.octave)) {
            this.defaults.octave = 3;
        }
    };

    $this.onstart = function() {
        this._octave = this.defaults.octave;
    };
    
    var keymap = (function(list, base) {
        var map;
        var i, imax;
        map = {};
        for (i = 0, imax = list.length; i < imax; i++) {
            map[list[i]] = base + i;
        }
        return map;
    }([65,87,83,69,68,70,84,71,89,72,85,74,75,79,76], 60));
    
    
    $this.$number = function(inlet, value, event, count) {
        var v;
        v = keymap[value.value|0];
        if (v) {
            v += (this._octave-3)*12;
            this.send(0, {type:NUMBER, value:v}, event, count);
        }
    };
    
    return ENZObjectEZKeyboard;
}());
enzui({klassName:"ezkeyboard", klass:ENZObjectEZKeyboard,
       whatis:"keyboard",
       category:"enzui.demo"});
                           





















var MSPObjectSlide = (function() {
    var MSPObjectSlide = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectSlide.prototype;
    
    $this.inlets  = 3;
    $this.outlets = 1;

    $this.initialize = function() {
        this.signalInlets = [ new Float32Array(this.STREAM_CELL_SIZE) ];
        this.signalModes  = [ true, false, false ];

        if (!isNaN(this.args[0])) {
            this.defaults.slideUp = +this.args[0];
        }
        if (!isNaN(this.args[1])) {
            this.defaults.slideDown = +this.args[1];
        }

        if (isNaN(this.defaults.slideUp)) {
            this.defaults.slideUp = 0;
        }
        if (isNaN(this.defaults.slideDown)) {
            this.defaults.slideDown = 0;
        }
    };
    
    $this.onstart = function() {
        this._slideUp   = this.defaults.slideUp;
        this._slideDown = this.defaults.slideDown;
        this._signalOutlets = this.getSignalOutlets(0);
        this._signal = new Float32Array(this.STREAM_CELL_SIZE);
        this._prevY = 0;
    };
    
    $this.$number = function(inlet, value, event, count) {
        if (inlet === 1) {
            this._slideUp   = +value.value;
        } else if (inlet === 2) {
            this._slideDown = +value.value;
        }
    };

    $this.onmsr = function() {
        this.resetSignals();
    };

    $this.onmsp = function() {
        var input, list, s;
        var _signal, _prevY, _slideUp, _slideDown;
        var slide;
        var i, imax, j;
        
        // input
        // y(n) = y(n-1) + ((x(n) - y (n-1))/slide)
        input  = this.signalInlets[0];
        _signal = this._signal;
        _prevY  = this._prevY;
        _slideUp   = this._slideUp;
        _slideDown = this._slideDown;
        for (i = 0, imax = _signal.length; i < imax; i++) {
            slide = (_prevY < input[i]) ? _slideUp : _slideDown;
            _prevY = _signal[i] = _prevY + ((input[i] - _prevY) / slide);
        }
        this._prevY = _prevY;
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            s = list[i];
            for (j = s.length; j--; ) {
                s[j] += _signal[j];
            }
        }
    };
    
    return MSPObjectSlide;
}());
enzui({klassName:"slide~", klass:MSPObjectSlide,
       whatis:"Filter a signal logarithmically",
       category:"msp.filters"});






var MSPObjectLine = (function() {
    var MSPObjectLine = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectLine.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;
    
    $this.initialize = function() {
        this._signal = new Float32Array(this.STREAM_CELL_SIZE);
        this._duration = 0;
        this._list = [[ 0, 0 ]];
        this._index = 0;
        this._currentValue = 0;
        this._sampleConter = 0;
        this._valueStep    = 0;
        this._finished = false;
    };
    
    $this.$number = function(inlet, value, event, count) {
        var _list, v0, v1, matches, items;
        var i, imax;
        
        if (inlet === 0) {
            v0 = value.value;
            v1 = 0;
            this._index = 0;
            this._list  = [[v0, v1]];
            this._currentValue = v0;
            this._sampleConter =  0;
            this._valueStep    =  0;
            this._finished     =  0;
        } else {
            value = value.value|0;
            if (value < 0) value = 0;
            this._duration = value;
        }
    };
    
    $this.$list = function(inlet, value, event, count) {
        var _list, v0, v1, matches, items;
        var i, imax;
        
        items = value.value;
        _list = [];
        for (i = 0, imax = items.length / 2; i < imax; i++) {
            v0 = Number(items[i*2+0]);
            v1 = this.SAMPLERATE * Number(items[i*2+1]) / 1000;
            _list.push([v0, v1]);
        }
        this._index = 0;
        this._list = _list;
        this._sampleConter = 0;
        v0 = _list[0][0];
        v1 = _list[0][1];
        if (v1 !== 0) {
            this._valueStep = (v0 - this._currentValue) / v1;
        } else {
            this._valueStep = 0;
        }
        this._finished = 0;
    };
    
    $this.onstart = function() {
        this._list = [[ 0, 0 ]];
        this._index = 0;
        this._currentValue = 0;
        this._sampleConter = 0;
        this._valueStep    = 0;
        this._finished     = 0;
        this._signalOutlets = this.objectbox.patchNodes[1][0].edges;
    };
    
    $this.onmsr = function() {
        var is;
        var _list, cur;
        
        var _index, _currentValue, _sampleConter, _valueStep;
        
        var counterLimit, lastValue, v0, v1;
        var i, imax;

        is   = this._signal;
        _list = this._list;
        
        if (this._finished === 0) {
            _index = this._index;
            _currentValue = this._currentValue;
            _sampleConter = this._sampleConter;
            _valueStep    = this._valueStep;
            counterLimit  = _list[_index][1];
            
            for (i = 0, imax = is.length; i < imax; i++) {
                is[i] = _currentValue;
                
                _currentValue += _valueStep;
                _sampleConter += 1;
                if (_sampleConter >= counterLimit) {
                    is[i] = _currentValue = _list[_index][0];
                    _index += 1;
                    if (_index >= _list.length) {
                        this._finished = 1;
                        break;
                    } else {
                        _sampleConter = 0;
                        v0 = _list[_index][0];
                        v1 = _list[_index][1];
                        
                        if (v1 !== 0) {
                            _valueStep = (v0-_currentValue) / v1;
                        } else {
                            _valueStep = 0;
                        }
                        counterLimit = v1;
                    }
                }
            }
            for (i = i + 1; i < imax; i++) is[i] = is[i-1];
            this._index = _index;
            this._currentValue = _currentValue;
            this._sampleConter = _sampleConter;
            this._valueStep    = _valueStep;
        } else if (this._finished === 1) {
            lastValue = is[is.length-1];
            for (i = is.length - 1; i--; ) {
                is[i] = lastValue;
            }
            this._finished = 2;
        } else { 
            // nothing to do
        }
    };
    
    $this.onmsp = function() {
        var is0, is1, e, os;
        var list, i, j, jmax;
        
        // input
        is0 = this._signal;
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            e = list[i];
            os = e.inlet.objectbox.objectbody.signalInlets[e.inlet.index];
            for (j = 0, jmax = os.length; j < jmax; j++) {
                os[j] += is0[j];
            }
        }
        
        if (this._finished === 2) {
            // this.send();
        } else {
            
        }
    };
    
    return MSPObjectLine;
}());
enzui({klassName:"line~", klass:MSPObjectLine,
       whatis:"Linear ramp generator",
       category:"msp.functions"});


var MSPObjectSig = (function() {
    var MSPObjectSig = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectSig.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 1;
    
    $this.initialize = function() {
        this.signalModes = [ false ];
        
        if (!isNaN(this.args[0])) {
            this.defaults.value = +this.args[0];
        }
        if (isNaN(this.defaults.value)) {
            this.defaults.value = 0;
        }
    };
    
    $this.onstart = function() {
        this._signalOutlets = this.getSignalOutlets(0);
        this._currentValue = this.defaults.value;
    };
    
    $this.$number = function(inlet, value, event, count) {
        this._currentValue = +value.value;
    };
    
    $this.onmsp = function() {
        var list, s, v;
        var i, j;
        
        v = this._currentValue;
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            s = list[i];
            for (j = s.length; j--; ) {
                s[j] += v;
            }
        }
    };
    
    return MSPObjectSig;
}());
enzui({klassName:"sig~", klass:MSPObjectSig,
       whatis:"Constant signal of a number",
       category:"msp.functions"});
    
    









var MSPObjectDAC = (function() {
    var MSPObjectDAC = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectDAC.prototype;
    
    $this.inlets  = 2;
    $this.outlets = 0;
    
    $this.initialize = function() {
        this.signalInlets = [ new Float32Array(this.STREAM_CELL_SIZE),
                              new Float32Array(this.STREAM_CELL_SIZE) ];
        
        if (this.CHANNEL === 2) {
            this.ondac = this._dac2ch;
        } else {
            this.ondac = this._dac1ch;
        }
        
        this._volume = 0.5;
        this._stop = false;
    };
    
    
    $this.onmsr = function() {
        this.resetSignals();
        //         var s0, s1, i;
        //         s0 = this.signalInlets[0];
        //         s1 = this.signalInlets[1];
        //         for (i = s0.length; i--; ) {
        //             s0[i] = s1[i] = 0.0;
        //         }
    };
    
    $this.onmsp = function() {};
    $this.ondac = function() {};
    
    $this._dac1ch = function() {
        var stream, s0, s1, vol;
        var i;
        console.log("1ch");
        stream = new Float32Array(this.STREAM_CELL_SIZE);
        s0 = this.signalInlets[0];
        s1 = this.signalInlets[1];
        vol = this.vol;
        for (i = stream.length; i--; ) {
            stream[i] = ((s0[i] + s1[i]) / 2.0) * vol;
        }
        return stream;
    };
    
    $this._dac2ch = function() {
        var stream, s0, s1, vol;
        var i;
        
        stream = new Float32Array(this.STREAM_CELL_SIZE * 2);
        s0 = this.signalInlets[0];
        s1 = this.signalInlets[1];
        vol = this._volume;
        for (i = stream.length - 2; i >= 0; i -= 2) {
            stream[i  ] = s0[i>>1] * vol;
            stream[i+1] = s1[i>>1] * vol;
        }
        return stream;
    };
    
    return MSPObjectDAC;
}());
enzui({klassName:"dac~", klass:MSPObjectDAC,
       whatis:"Audio output and on/off",
       category:"msp.io"});









    
var MSPObjectAdd = (function() {
    var MSPObjectAdd = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectAdd.prototype;

    $this.inlets  = 2;
    $this.outlets = 1;
    
    $this.initialize = function() {
        this.signalInlets = [ new Float32Array(this.STREAM_CELL_SIZE),
                              new Float32Array(this.STREAM_CELL_SIZE) ];
        
        if (!isNaN(this.args[0])) {
            this.defaults.value1 = +this.args[0];
        }
        
        if (isNaN(this.defaults.value1)) {
            this.defaults.value1 = 0;
        }
    };
    
    $this.onstart = function() {
        var s, i, v;

        if (! this.objectbox.patchNodes[0][0].signal) {
            s = this.signalInlets[0];
            for (i = s.length; i--; ) {
                s[i] = 0;
            }
        }
        
        if (! this.objectbox.patchNodes[0][1].signal) {
            v = this.defaults.value1;
            s = this.signalInlets[1];
            for (i = s.length; i--; ) {
                s[i] = v;
            }
        }
        
        this._signalOutlets = this.getSignalOutlets(0);
    };
    
    
    $this.$number = function(inlet, value, event, count) {
        var s, i, v;
        v = +value.value;
        s = this.signalInlets[inlet];
        for (i = s.length; i--; ) {
            s[i] = v;
        }
    };
    
    $this.onmsr = function() {
        this.resetSignals();
    };
    
    $this.onmsp = function() {
        var i_s0, i_s1, o_s;
        var list, i, j;
        
        // input
        i_s0 = this.signalInlets[0];
        i_s1 = this.signalInlets[1];
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            o_s = list[i];
            for (j = o_s.length; j--; ) {
                o_s[j] += i_s0[j] + i_s1[j];
            }
        }
    };
    
    return MSPObjectAdd;
}());
enzui({klassName:"+~", klass:MSPObjectAdd,
       whatis:"Add signals",
       category:"msp.operators"});


var MSPObjectSubtract = (function() {
    var MSPObjectSubtract = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectSubtract.prototype;

    $this.onmsp = function() {
        var i_s0, i_s1, o_s;
        var list, i, j;
        
        // input
        i_s0 = this.signalInlets[0];
        i_s1 = this.signalInlets[1];
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            
            o_s = list[i];
            for (j = o_s.length; j--; ) {
                o_s[j] += i_s0[j] - i_s1[j];
            }
        }
    };
    
    return MSPObjectSubtract;
}());
enzui({klassName:"-~", klass:MSPObjectSubtract, extend: "+~",
       whatis:"Signal subtraction",
       category:"msp.operators"});


var MSPObjectReversedSubtract = (function() {
    var MSPObjectReversedSubtract = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectReversedSubtract.prototype;

    $this.onmsp = function() {
        var i_s0, i_s1, o_s;
        var list, i, j;
        
        // input
        i_s0 = this.signalInlets[0];
        i_s1 = this.signalInlets[1];
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            
            o_s = list[i];
            for (j = o_s.length; j--; ) {
                o_s[j] += i_s1[j] - i_s0[j];
            }
        }
    };
    
    return MSPObjectReversedSubtract;
}());
enzui({klassName:"-!~", klass:MSPObjectSubtract, extend: "+~",
       whatis:"Signal subtraction (inlets reversed)",
       category:"msp.operators"});
    

var MSPObjectMultiple = (function() {
    var MSPObjectMultiple = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectMultiple.prototype;

    $this.onmsp = function() {
        var i_s0, i_s1, o_s;
        var list, i, j;
        
        // input
        i_s0 = this.signalInlets[0];
        i_s1 = this.signalInlets[1];
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            o_s = list[i];
            for (j = o_s.length; j--; ) {
                o_s[j] += i_s0[j] * i_s1[j];
            }
        }
    };
    
    return MSPObjectMultiple;
}());
enzui({klassName:"*~", klass:MSPObjectMultiple, extend: "+~",
       whatis:"Multiply two signals",
       category:"msp.operators"});


var MSPObjectDivision = (function() {
    var MSPObjectDivision = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectDivision.prototype;

    $this.onmsp = function() {
        var i_s0, i_s1, o_s;
        var list, i, j;
        
        // input
        i_s0 = this.signalInlets[0];
        i_s1 = this.signalInlets[1];
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            
            o_s = list[i];
            for (j = o_s.length; j--; ) {
                if (i_s1[j] !== 0) {
                    o_s[j] += i_s0[j] / i_s1[j];
                }
            }
        }
    };
    
    return MSPObjectDivision;
}());
enzui({klassName:"/~", klass:MSPObjectDivision, extend: "+~",
       whatis:"Divide one signal by another",
       category:"msp.operators"});


var MSPObjectReversedDivision = (function() {
    var MSPObjectReversedDivision = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectReversedDivision.prototype;

    $this.onmsp = function() {
        var i_s0, i_s1, o_s;
        var list, i, j;
        
        // input
        i_s0 = this.signalInlets[0];
        i_s1 = this.signalInlets[1];
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            
            o_s = list[i];
            for (j = o_s.length; j--; ) {
                if (i_s0[j] !== 0) {
                    o_s[j] += i_s1[j] / i_s0[j];
                }
            }
        }
    };
    
    return MSPObjectReversedDivision;
}());
enzui({klassName:"!/~", klass:MSPObjectReversedDivision, extend: "+~",
       whatis:"Division object (inlets reversed)",
       category:"msp.operators"});
























var MSPObjectClick = (function() {
    var MSPObjectClick = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectClick.prototype;

    $this.inlets  = 1;
    $this.outlets = 1;

    $this.initialize = function() {
        this.defaults.pattern = [ 1.0 ];
        this.signalModes = [ false ];


        if (this.args.length) {
            this.defaults.pattern = this.args.split(/\s+/).map(function(n) {
                return !isNaN(n) ? +n : 0;
            });
        }
        
        this._signal = null;
        this._index = 0;
        this._mode = 0;
        this._clickPattern = [];
        
    };

    $this.onstart = function() {
        this._index = 0;
        this._mode  = 0;
        this._clickPattern = this.defaults.pattern;
        this._signal = new Float32Array(this.STREAM_CELL_SIZE);
        this._signalOutlets = this.getSignalOutlets(0);
    };
    
    $this.$bang = function() {
        this._index = 0;
        this._mode  = 1;
    };
    
    $this.$set = function(inlet, value, event, count) {
        this._clickPattern = value.value.split(/\s+/).map(function(n) {
            return !isNaN(n) ? +n : 0;
        });
    };
    
    $this.onmsp = function() {
        var list, s, v;
        var _signal, _index, _clickPattern;
        var i, imax, j;
        
        
        _signal = this._signal;
        
        // input
        if (this._mode === 1) {
            _index  = this._index;
            _clickPattern = this._clickPattern;
            for (i = 0, imax = _signal.length; i < imax; i++) {
                _signal[i] = _clickPattern[_index] || 0.0;
                _index += 1;
            }
            this._index = _index;
            if (_index >= _clickPattern.length) {
                this._mode = 2;
            }
        } else if (this._mode === 2) {
            for (i = 0, imax = _signal.length; i < imax; i++) {
                _signal[i] = 0.0;
            }
            this._mode = 0;
        }
        
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            s = list[i];
            for (j = s.length; j--; ) {
                s[j] += _signal[j];
            }
        }
    };
    
    
    return MSPObjectClick;
}());
enzui({klassName:"click~", klass:MSPObjectClick,
       whatis:"Create an impulse",
       category:"msp.synthesis"});

    
var MSPObjectCycle = (function() {
    var MSPObjectCycle = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectCycle.prototype;
    
    $this.inlets  = 2;
    $this.outlets = 1;
    
    var sintable = (function() {
        var list, i;
        list = new Float32Array(512);
        for (i = 0; i < 512; i++) {
            list[i] = Math.sin(Math.PI * 2 * (i/512));
        }
        return list;
    }());
    
    $this.initialize = function() {
        var items;

        this.signalInlets = [ new Float32Array(this.STREAM_CELL_SIZE),
                              new Float32Array(this.STREAM_CELL_SIZE) ];
        
        if (!isNaN(this.args[0])) {
            this.defaults.freq = +this.args[0];
        }

        if (isNaN(this.defaults.freq)) {
            this.defaults.freq = 0;
        }
        
        this._buffer = new Float32Array(this.STREAM_CELL_SIZE);
    };
    
    $this.onstart = function() {
        if (this.objectbox.patchNodes[0][0].signal) {
            // signal mode
            this.onmsr = $this._onmsr_signal;
            this.onmsp = $this._onmsp_signal;
            
        } else {
            // value mode
            this.onmsp = $this._onmsp_value;
            this._phaseStep = 512 * this.defaults.freq / this.SAMPLERATE;
        }
        this._phase = 0;
        this._wavelet = sintable;
        this._signalOutlets = this.getSignalOutlets(0);
    };
    
    $this.$number = function(inlet, value, event, count) {
        var freq;
        if (inlet === 0) {
            this._phaseStep = (512 * value.value) / this.SAMPLERATE;
        }
    };
    
    $this.onmsr = function() {};
    $this.onmsp = function() {};

    $this._onmsr_signal = function() {
        this.resetSignals();
    };
    
    $this._onmsp_signal = function() {
        var i_s0;
        var SAMPLERATE;
        var _buffer, _wavelet, _phase, _phaseStep;
        var freq;
        var index, delta, v1, v2;
        var list, s;
        var i, imax, j, jmax;
        
        // input
        i_s0 = this.signalInlets[0];
        SAMPLERATE = this.SAMPLERATE;
        
        _buffer    = this._buffer;
        _wavelet   = this._wavelet;
        _phase     = this._phase;
        
        for (i = 0, imax = _buffer.length; i < imax; i++) {
            index = _phase|0;
            delta = _phase - index;
            v1 = _wavelet[(index+0) & 511];
            v2 = _wavelet[(index+1) & 511];
            _buffer[i] = (1.0-delta) * v1 + delta * v2;
            
            _phase += (512 * i_s0[i]) / SAMPLERATE;
        }
        this._phase = _phase;
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            s = list[i];
            for (j = 0, jmax = s.length; j < jmax; j++) {
                s[j] += _buffer[j];
            }
        }
    };

    $this._onmsp_value = function() {
        var _buffer, _wavelet, _phase, _phaseStep;
        var index, delta, v1, v2;
        var list, s;
        var i, imax, j, jmax;
        
        // input
        _buffer    = this._buffer;
        _wavelet   = this._wavelet;
        _phase     = this._phase;
        _phaseStep = this._phaseStep;
        
        for (i = 0, imax = _buffer.length; i < imax; i++) {
            index = _phase|0;
            delta = _phase - index;
            v1 = _wavelet[(index+0) & 511];
            v2 = _wavelet[(index+1) & 511];
            _buffer[i] = (1.0-delta) * v1 + delta * v2;
            _phase += _phaseStep;
        }
        this._phase = _phase;
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            s = list[i];
            for (j = 0, jmax = s.length; j < jmax; j++) {
                s[j] += _buffer[j];
            }
        }
    };
    
    
    return MSPObjectCycle;
}());
enzui({klassName:"cycle~", klass:MSPObjectCycle,
       whatis:"Table lookup oscillator",
       category:"msp.synthesis"});


var MSPObjectRect = (function() {
    var MSPObjectRect = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectRect.prototype;

    $this.inlets = 2;
    
    var recttable = (function() {
        var list, i;
        list = new Float32Array(512);
        for (i = 0; i < 512; i++) {
            list[i] = i < 256 ? +1 : -1;
        }
        return list;
    }());
    
    
    $this.onstart = function() {
        $this.superclass.onstart.apply(this);
        this._wavelet = recttable;
    };


    $this.$number = function(inlet, value, event, count) {
        var freq;
        if (inlet === 0) {
            this._phaseStep = (512 * value.value) / this.SAMPLERATE;
        } else if (inlet === 1) {
            this._wavelet = (function(v) {
                var list, i, j;
                list = new Float32Array(512);
                j = 512 * v;
                for (i = 0; i < 512; i++) {
                    list[i] = i < j ? +1 : -1;
                }
                return list;
            }(value.value));
        }
    };

    
    return MSPObjectRect;
}());
enzui({klassName:"rect~", klass:MSPObjectRect, extend:"cycle~",
       whatis:"Antialiased rectangular (pulse) oscillator",
       category:"msp.synthesis"});


var MSPObjectNoise = (function() {
    var MSPObjectNoise = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectNoise.prototype;
    
    $this.inlets  = 0;
    $this.outlets = 1;
    
    $this.initialize = function() {
        this.str = "noise~";
        this._signal = new Float32Array(this.STREAM_CELL_SIZE);
        this._signalOutlets = [];
    };

    $this.onstart = function() {
        this._signalOutlets = this.getSignalOutlets(0);
    };
    
    $this.onmsp = function() {
        var _signal;
        var list, s;
        var i, j, jmax;
        
        // input
        _signal = this._signal;
        for (i = _signal.length; i--; ) {
            _signal[i] = Math.random() * 2.0 - 1.0;
        }
        
        // output
        list = this._signalOutlets;
        for (i = list.length; i--; ) {
            s = list[i];
            for (j = 0, jmax = _signal.length; j < jmax; j++) {
                s[j] += _signal[j];
            }
        }
    };
    
    return MSPObjectNoise;
}());
enzui({klassName:"noise~", klass:MSPObjectNoise,
       whatis:"White noise generator",
       category:"msp.synthesis"});









    
var MSPObjectScope = (function() {
    var MSPObjectScope = function() {
        this.initialize.apply(this, arguments);
    }, $this = MSPObjectScope.prototype;
    
    $this.inlets  = 1;
    $this.outlets = 0;
    
    $this.initialize = function() {
        this.signalInlets = [ new Float32Array(this.STREAM_CELL_SIZE),
                              new Float32Array(this.STREAM_CELL_SIZE) ];
        
        this._bufferSize  = 1;
        this._displaySize = 1024;
        
        this._buffer1 = new Float32Array(this._bufferSize );
        this._buffer2 = new Float32Array(this._displaySize);
        this._index1 = 0;
        this._index2 = 0;
    };
    
    $this.resize = function() {
        this.objectbox.width  = 320;
        this.objectbox.height = 240;
    };
    
    $this.onmsr = function() {
        var s0, s1, i;
        s0 = this.signalInlets[0];
        s1 = this.signalInlets[1];
        for (i = s0.length; i--; ) {
            s0[i] = s1[i] = 0.0;
        }
    };
    
    $this.onmsp = function() {
        var _buffer1, len1;
        var _buffer2, len2;
        var s, _index1, _index2;
        var sum;
        var i, imax, j, jmax;
        _buffer1 = this._buffer1;
        _buffer2 = this._buffer2;
        len1 = _buffer1.length;
        len2 = _buffer2.length;
        _index1 = this._index1;
        _index2 = this._index2;
        s = this.signalInlets[0];
        for (i = 0, imax = s.length; i < imax; i++) {
            _buffer1[_index1] = s[i];
            _index1 += 1;
            if (_index1 >= len1) {
                sum = 0;
                for (j = 0; j < len1; j++) {
                    sum += _buffer1[j];
                }
                // console.log("->", sum/len1);
                sum /= len1;
                _buffer2[_index2] = sum;
                _index2 += 1;
                if (_index2 >= len2) {
                    _index2 = 0;
                }
                _index1 = 0;
            }
        }
        this._index1 = _index1;
        this._index2 = _index2;

        // console.log(this._index1, this._index2);
    };
    
    var calcY = function(v, h) {
        return (v * h/2);
    };

    $this.draw = function(painter, x, y, w, h) {
        painter.rect(x, y, w, h, "silver", "gray");
        painter.drawtheline(x, y + h/2, x+w, y+h/2, "dimgray");
    };
    
    $this.onanimate = function(painter, x, y, w, h) {
        var path, _buffer2;
        var dx, i, imax;
        var my;
        
        painter.rect(x, y, w, h, "silver", "gray");
        painter.drawtheline(x, y + h/2, x+w, y+h/2, "dimgray");
        
        dx = w / this._displaySize;
        _buffer2 = this._buffer2;
        path = [];
        my = (y + h/2);
        path.push(x, my - calcY(_buffer2[0], h));
        
        for (i = 1, imax = this._displaySize - 1; i < imax; i++) {
            path.push(x + i * dx, my - calcY(_buffer2[i], h));
        }
        path.push(x + w, my - calcY(_buffer2[i], h));
        
        painter.path(path, "lime");
    };
    
    return MSPObjectScope;
}());
enzui({klassName:"scope~", klass:MSPObjectScope});




// Expose enzui to the global object    
window.enzui = enzui;



}(window));
