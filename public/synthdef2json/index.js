(function() {
  $(function() {
    'use strict';
    var SynthDefParser, editor, main, pp, spec, tab, val;

    $(window).on('dragover', function() {
      return false;
    });
    $(window).on('drop', function(e) {
      main(e.originalEvent.dataTransfer.files[0]);
      return false;
    });
    editor = ace.edit('editor');
    editor.setTheme('ace/theme/monokai');
    editor.setPrintMarginColumn(-1);
    editor.getSession().setTabSize(2);
    editor.getSession().setMode('ace/mode/json');
    SynthDefParser = (function() {
      var readDefJSON, readDefListJSON, readParamsJSON, readSpecJSON, readSpecListJSON, readVariants;

      function SynthDefParser(file) {
        this.file = file;
        this.index = 0;
      }

      SynthDefParser.prototype.byte = function() {
        return this.file[this.index++];
      };

      SynthDefParser.prototype.int8 = function() {
        return this.file[this.index++];
      };

      SynthDefParser.prototype.int16 = function() {
        return (this.file[this.index++] << 8) + this.file[this.index++];
      };

      SynthDefParser.prototype.int32 = function() {
        return (this.file[this.index++] << 24) + (this.file[this.index++] << 16) + (this.file[this.index++] << 8) + this.file[this.index++];
      };

      SynthDefParser.prototype.float32 = function() {
        return new Float32Array(new Int32Array([this.int32()]).buffer)[0];
      };

      SynthDefParser.prototype.text = function() {
        var i, len;

        len = this.file[this.index++];
        return String.fromCharCode.apply(null, (function() {
          var _i, _results;

          _results = [];
          for (i = _i = 0; _i < len; i = _i += 1) {
            _results.push(this.file[this.index++]);
          }
          return _results;
        }).call(this));
      };

      SynthDefParser.prototype.toJSON = function(file) {
        var header, i, version;

        this.file = file;
        this.index = 0;
        header = ((function() {
          var _i, _results;

          _results = [];
          for (i = _i = 0; _i <= 3; i = ++_i) {
            _results.push(String.fromCharCode(this.byte()));
          }
          return _results;
        }).call(this)).join("");
        if (header !== "SCgf") {
          return null;
        }
        version = this.int32();
        if (version !== 2) {
          return null;
        }
        return {
          version: version,
          defs: readDefListJSON.call(this)
        };
      };

      readDefListJSON = function() {
        var i, _i, _ref, _results;

        _results = [];
        for (i = _i = 0, _ref = this.int16(); _i < _ref; i = _i += 1) {
          _results.push(readDefJSON.call(this));
        }
        return _results;
      };

      readDefJSON = function() {
        var i, obj, p, u;

        obj = {
          name: this.text(),
          consts: (function() {
            var _i, _ref, _results;

            _results = [];
            for (i = _i = 0, _ref = this.int32(); _i < _ref; i = _i += 1) {
              _results.push(this.float32());
            }
            return _results;
          }).call(this)
        };
        p = this.int32();
        obj.params = readParamsJSON.call(this, p);
        u = this.int32();
        obj.specs = readSpecListJSON.call(this, u);
        obj.variants = readVariants.call(this, p);
        return obj;
      };

      readParamsJSON = function(num) {
        var i, names, values, _i, _ref;

        values = (function() {
          var _i, _results;

          _results = [];
          for (i = _i = 0; _i < num; i = _i += 1) {
            _results.push(this.float32());
          }
          return _results;
        }).call(this);
        names = [];
        for (i = _i = 0, _ref = this.int32(); _i < _ref; i = _i += 1) {
          names.push(this.text(), this.int32());
        }
        return {
          values: values,
          names: names
        };
      };

      readSpecListJSON = function(num) {
        var i, _i, _results;

        _results = [];
        for (i = _i = 0; _i < num; i = _i += 1) {
          _results.push(readSpecJSON.call(this));
        }
        return _results;
      };

      readSpecJSON = function() {
        var i, input_len, inputs, name, output_len, outputs, rate, specialIndex, _i, _j;

        name = this.text();
        rate = this.int8();
        input_len = this.int32();
        output_len = this.int32();
        specialIndex = this.int16();
        inputs = [];
        for (i = _i = 0; _i < input_len; i = _i += 1) {
          inputs.push(this.int32(), this.int32());
        }
        outputs = [];
        for (i = _j = 0; _j < output_len; i = _j += 1) {
          outputs.push(this.int8());
        }
        return [name, rate, specialIndex, inputs, outputs];
      };

      readVariants = function(num) {
        var i, j, list, _i, _ref;

        list = {};
        for (i = _i = 0, _ref = this.int16(); _i < _ref; i = _i += 1) {
          list[this.text()] = [
            (function() {
              var _j, _results;

              _results = [];
              for (j = _j = 0; _j < num; j = _j += 1) {
                _results.push(this.float32());
              }
              return _results;
            }).call(this)
          ];
        }
        return list;
      };

      return SynthDefParser;

    })();
    tab = function(n) {
      var i;

      return ((function() {
        var _i, _results;

        _results = [];
        for (i = _i = 0; 0 <= n ? _i < n : _i > n; i = 0 <= n ? ++_i : --_i) {
          _results.push(" ");
        }
        return _results;
      })()).join("");
    };
    val = function(x) {
      if (typeof x === "string") {
        return '"' + x + '"';
      } else {
        return x;
      }
    };
    spec = function(spec) {
      var items;

      items = [];
      items.push(val(spec[0]), spec[1], spec[2]);
      items.push("[ " + (spec[3].join(', ')) + " ]");
      items.push("[ " + (spec[4].join(', ')) + " ]");
      return items.join(", ");
    };
    pp = function(json) {
      var comma, def, i, j, keys, str, _i, _j, _k, _ref, _ref1, _ref2;

      str = [];
      str.push("{");
      str.push(tab(2) + ("'version': " + json.version + ","));
      str.push(tab(2) + "'defs': [");
      for (i = _i = 0, _ref = json.defs.length; _i < _ref; i = _i += 1) {
        def = json.defs[i];
        str.push(tab(4) + "{");
        str.push(tab(6) + ("'name': '" + def.name + "',"));
        str.push(tab(6) + ("'consts': [ " + (def.consts.join(', ')) + " ],"));
        str.push(tab(6) + "'params': {");
        str.push(tab(8) + ("'values': [ " + (def.params.values.join(', ')) + " ],"));
        str.push(tab(8) + ("'names': [ " + (def.params.names.map(val).join(', ')) + " ]"));
        str.push(tab(6) + "},");
        str.push(tab(6) + "'specs': [");
        for (j = _j = 0, _ref1 = def.specs.length; _j < _ref1; j = _j += 1) {
          comma = j < def.specs.length - 1 ? "," : "";
          str.push(tab(8) + ("[ " + (spec(def.specs[j])) + " ]") + comma);
        }
        str.push(tab(6) + "],");
        str.push(tab(6) + "'variants': {");
        keys = Object.keys(def.variants);
        for (j = _k = 0, _ref2 = keys.length; _k < _ref2; j = _k += 1) {
          comma = j < keys.length - 1 ? "," : "";
          str.push(tab(8) + ("'" + keys[j] + "': [ " + (def.variants[keys[j]].map(val).join(', ')) + " ]") + comma);
        }
        str.push(tab(6) + "}");
        comma = i < json.defs.length - 1 ? "," : "";
        str.push(tab(4) + "}" + comma);
      }
      str.push(tab(2) + "]");
      str.push("}");
      return str.join("\n").replace(/\'/g, '"').replace(/\[  \]/g, '[]');
    };
    return main = function(file) {
      var reader;

      reader = new FileReader;
      reader.onload = function(e) {
        var json;

        json = new SynthDefParser().toJSON(new Uint8Array(e.target.result));
        if (json) {
          editor.setValue(pp(json));
          return editor.clearSelection();
        }
      };
      return reader.readAsArrayBuffer(file);
    };
  });

}).call(this);
