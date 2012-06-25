Ext.ns('Ext.rmn');

Ext.BLANK_IMAGE_URL = 'http://extjs.cachefly.net/ext-3.1.0/resources/images/default/s.gif';

//tooltip on textfield
Ext.override(Ext.form.TextField, {
    afterRender: Ext.form.TextField.prototype.afterRender.createSequence(function(){
        if(this.qtip){
            var target = this.getTipTarget();
            if(typeof this.qtip == 'object'){
                Ext.QuickTips.register(Ext.apply({
                    target: target
                }, this.qtip));
            } else {
                target.dom.qtip = this.qtip;
            }
        }
    }),
    getTipTarget: function(){
        return this.el;
    }
});

Ext.rmn.presets = {
    'Eur JOC' : {
        '1H' : {
            'from'     : 'Word',
            'nbCols'   : 5,
            'before'   : 'NMR <sup>1</sup>H (CDCl<sub>3</sub>, 400 MHz) &delta; (ppm) : ',
            'lineTpl'  : '{1} ({2},[ J={3} Hz,][ {4}H,] subNb({5}))',
            'joinWith' : '; ',
            'after'    : '.'
        },
        '13C' : {
            'from'     : 'Word',
            'nbCols'   : 2,
            'before'   : 'NMR <sup>13</sup>C (CDCl<sub>3</sub>, 100 MHz) &delta; (ppm) : ',
            'lineTpl'  : '{1} (subNb({2}))',
            'joinWith' : '; ',
            'after'    : '.'
        }
    },
    'Org Lett' : {
        '1H' : {
            'from'     : 'Word',
            'nbCols'   : 5,
            'before'   : '<sup>1</sup>H NMR (400 MHz, CDCl<sub>3</sub>) &delta;: ',
            'lineTpl'  : '{1} ({2}[, J = {3} Hz][, {4}H])',
            'joinWith' : ', ',
            'after'    : '.'
        },
        '13C' : {
            'from'     : 'Word',
            'nbCols'   : 2,
            'before'   : '<sup>13</sup>C NMR (100 MHz, CDCl<sub>3</sub>) &delta;: ',
            'lineTpl'  : '{1}',
            'joinWith' : '; ',
            'after'    : '.'
        }
    }
};

var localPresets = localStorage.getItem('presets');
if(localPresets){
    Ext.rmn.presets['Sauvegarde locale'] = Ext.decode(localPresets);
}

Ext.onReady(function(){
    Ext.QuickTips.init();

    var viewport = new Ext.Viewport({
        layout : 'border',
        items : [{
            region  : 'north',
            xtype   : 'rmn-presets',
            presets : Object.keys(Ext.rmn.presets),
            height  : 30,
            ref     : 'presetsTB'
        },{
            region : 'center',
            xtype  : 'container',
            layout : {
                type    : 'vbox',
                padding : '5',
                align   : 'stretch'
            },
            items:[{
                xtype   : 'rmn-panel',
                rmnType : '1H',
                title   : 'RMN <sup>1</sup>H',
                flex    : 1,
                margins : '0 0 15 0',
                ref     : '../rmn1H'
            },{
                xtype   : 'rmn-panel',
                rmnType : '13C',
                title   : 'RMN <sup>13</sup>C',
                flex    : 1,
                ref     : '../rmn13C'
            }]
        }]
    });
    
    function applyPresets(presets){
        viewport.rmn1H. applyOptions(Ext.rmn.presets[presets]['1H']);
        viewport.rmn13C.applyOptions(Ext.rmn.presets[presets]['13C']);
    }
    
    viewport.presetsTB.on('presets-selected', function(presets){
        applyPresets(presets);
    });
    
    viewport.presetsTB.on('save', function(){
        var presets = {
            '1H'  : viewport.rmn1H. getOptions(),
            '13C' : viewport.rmn13C.getOptions()
        };
        localStorage.setItem('presets', Ext.encode(presets));
        Ext.rmn.presets['Sauvegarde locale'] = presets;
    });
    
    if(localPresets){
        viewport.presetsTB.select('Sauvegarde locale');
        applyPresets('Sauvegarde locale');
    }
});

Ext.rmn.PresetsToolbar = Ext.extend(Ext.Toolbar, {
    
    initComponent : function(){
        var config = {
            items : [{
                xtype : 'tbtext',
                text : '<b>Paramètres : </b>'
            },{
                xtype : 'combo',
                store : this.presets,
                ref   : 'combo',
                triggerAction : 'all',
                forceSelection : true,
                editable : false
            }, {
                text    : 'Sauvegarder les paramètres courants (localement)',
                handler : function(){
                    this.fireEvent('save');
                },
                scope   : this
            }]
        };
        this.addEvents('save', 'presets-selected');
        // apply config
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        // call parent
        Ext.rmn.PresetsToolbar.superclass.initComponent.apply(this, arguments);
        
        this.combo.on('select', function(){
            this.fireEvent('presets-selected', this.combo.getValue());
        }, this);
    },
    select : function(presets){
        this.combo.setValue(presets);
    }
});
Ext.reg('rmn-presets', Ext.rmn.PresetsToolbar);


Ext.rmn.RmnPanel = Ext.extend(Ext.Panel,{
    initComponent : function(){
        var config = {
            layout : {
                type  : 'hbox',
                align : 'stretch'
            },
            defaults : {
                border : false
            },
            items : [{
                xtype : 'paste-panel',
                ref   : 'pastePanel',
                title : 'Coller le tableau depuis Word ou OpenOffice',
                flex  : 1,
                style : {
                    borderRight : '1px solid #8DB2E3'
                }
            },{
                xtype : 'tabpanel',
                ref   : 'tabPanel',
                flex  : 1,
                activeItem     : 0,
                deferredRender : false,
                items:[{
                    title   : 'Options',
                    xtype   : 'options-panel',
                    rmnType : this.initialConfig.rmnType,
                    rmnText : this.title,
                    ref     : '../optionsPanel'
                },{
                    title : 'Résultat',
                    html  : 'Cliquez sur "Mettre en forme" pour voir le résultat.',
                    ref   : '../resultZone',
                    autoScroll : true,
                    bodyStyle : {
                        padding : 5
                    },
                    bbar : [{
                        xtype : 'tbtext',
                        text  : "Des résultats étranges ? Vérifiez votre format de ligne et le logiciel d'origine.",
                        cls   : 'icon-strange'
                    }]
                }]
            }]
        };

        // apply config
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        // call parent
        Ext.rmn.RmnPanel.superclass.initComponent.apply(this, arguments);

        //events
        this.pastePanel.on('formatclicked',function(rawData){
            var options       = this.optionsPanel.getOptions();
            var cleanData     = this.clean(rawData,options);
            var formattedData = this.format(cleanData,options.template);

           // if(!this.resultZone.rendered) this.resultZone.render();
            this.resultZone.body.update(formattedData);
            this.tabPanel.setActiveTab(1);
        },this);
    },
    applyOptions : function(options){
        this.optionsPanel.applyOptions(options);
    },
    getOptions : function(){
        return this.optionsPanel.getFlatOptions();
    },
    format : function(data, template){
        var formattedData  = template.before;
        var formattedLines = [];

        for(var i = 0, l = data.length; i != l; i++){
            var formattedLine = this.formatRow(template.lineTpl, data[i]);
            formattedLines.push(formattedLine);
        }
        formattedData += formattedLines.join(template.joinWith);
        formattedData += template.after;
        return formattedData;
    },
    /**
     * replaces {i} with data[i-1]
     * if a block is surrounded by [some{i}block], it's removed is data[i-1] is '' or '-'
     */
    formatRow : function (template, data){
        for(var k = 0; k != data.length; k++){
            //if data not here, strip the [...]
            if(data[k] === '' || data[k] === '-'){
                template = template.replace(new RegExp('\\[[^\\[]*\\{'+(k+1)+'\\}[^\\[]*\\]'),'');
            }else{
                //remove the [] markers
                template = template.replace(new RegExp('\\[([^\\[]*\\{'+(k+1)+'\\}[^\\[]*)\\]'),'$1');
                //replace {i}
                template = template.replace("{" + (k+1) + "}", data[k]);
            }
        }
        //exec template functions
        template = template.replace(new RegExp('subNb\\(([^)]*)\\)'), function(match, text){
            return text.replace(/(\d+)/g, '<sub>$1</sub>');
        });
        template = template.replace(new RegExp('supNb\\(([^)]*)\\)'), function(match, text){
            return text.replace(/(\d+)/g, '<sup>$1</sup>');
        });
        template = template.replace(new RegExp('virgule\\(([^)]*)\\)'), function(match, text){
            return text.replace(/\./g, ',');
        });
        return template;
    },
    clean : function(rawData, options){
        var cleanData = [], i;
        if(options.fromWord){ //rows are \n-separated and cols are \t-separated
            var rows = rawData.split('\n');
            rows.pop();//last \n
            for(i = 0, l = rows.length; i != l; i++){
                cleanData.push(rows[i].split('\t'));
            }
        } else if(options.fromOpenOffice){ //no rows or cols, one item per line
            var items = rawData.split('\n');
            items.pop();
            var row;
            for(i = 0, l = items.length; i != l;/*i is incremented in inner loop*/){
                row = [];
                for (var j = 0; j != options.nbCols; j++, i++){
                    row.push(items[i]);
                }
                cleanData.push(row);
            }
        }
        return cleanData;
    }
});
Ext.reg('rmn-panel', Ext.rmn.RmnPanel);



Ext.rmn.PastePanel = Ext.extend(Ext.Panel,{
    initComponent : function(){
        //preconfiguration
        var config = {
            layout : 'fit',
            tbar : [{
                text    : 'Effacer',
                icon    : 'icons/delete.png',
                scope   : this,
                handler : function(){
                    this.pasteZone.setValue('');
                }
            }, '->', {
                text    : 'Mettre en forme',
                icon    : 'icons/style_go.png',
                scope   : this,
                handler : function(){
                    this.fireEvent('formatclicked',this.pasteZone.getValue());
                }
            }],
            items:{
                xtype : 'textarea',
                ref   : 'pasteZone',
                cls   : 'paste-zone'
            }
        };

        //events
        this.addEvents('formatclicked');//when you click the 'Mettre en forme' button

        // apply config
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        // call parent
        Ext.rmn.PastePanel.superclass.initComponent.apply(this, arguments);
    }
});
Ext.reg('paste-panel', Ext.rmn.PastePanel);

Ext.rmn.OptionsPanel = Ext.extend(Ext.FormPanel,{
    initComponent : function(){

        var config = {
            labelWidth : 160,
            autoScroll : true,
            bodyStyle  : {
                backgroundColor : '#DFE8F6',
                padding : 10
            },
            footerStyle : {
                backgroundColor : '#DFE8F6'
            },
            layoutConfig : {
                trackLabels : true
            },
            items : [{
                xtype      : 'radiogroup',
                name       : this.rmnType + '-from',//fake name so that setValues works
                fieldLabel : "Logiciel d'origine",
                items : [{
                    boxLabel   : 'Word',
                    name       : this.rmnType + '-from',//name must be different for each panel instance
                    inputValue : 'Word'
                },{
                    boxLabel   : 'OpenOffice',
                    name       : this.rmnType + '-from',
                    inputValue : 'OpenOffice',
                    handler : function(radio,checked){
                        this.spinner.setVisible(checked);
                    },
                    scope : this
                }]

            },{
                xtype          : 'spinnerfield',
                ref            : 'spinner',
                name           : this.rmnType + '-nbCols',
                fieldLabel     : 'Nombre de colonnes',
                hidden         : true,
                minValue       : 1,
                maxValue       : 10,
                allowDecimals  : false,
                incrementValue : 1
            },{
                xtype      : 'textfield',
                name       : this.rmnType+'-before',
                fieldLabel : 'Texte avant',
                anchor     : '95%',
                qtip       : 'Ce texte sera inséré au début.'
            },{
                xtype      : 'textfield',
                name       : this.rmnType + '-lineTpl',
                fieldLabel : 'Format de ligne',
                anchor     : '95%',
                qtip       : "<p>Utilisez {n} pour insérer l'élément n.</p>"+
                             "<p>Utilisez des [...] pour supprimer un bloc si l'élément est vide</p>"+
                             "<p>Utilisez subNb() pour mettre les chiffres en indice.</p>"
            },{
                xtype      : 'textfield',
                name       : this.rmnType + '-joinWith',
                fieldLabel : 'Joindre les lignes avec',
                anchor     : '95%',
                qtip       : 'Séparateur de lignes.'
            },{
                xtype      : 'textfield',
                name       : this.rmnType+'-after',
                fieldLabel : 'Texte après',
                anchor     : '95%',
                qtip       : 'Ce texte sera inséré à la fin.'
            }]
        };

        // apply config
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        // call parent
        Ext.rmn.OptionsPanel.superclass.initComponent.apply(this, arguments);
    },
    applyOptions : function(options){
        var values = [];
        Ext.iterate(options, function(key, value){
            values.push({
                id    : this.rmnType + '-' + key,
                value : value
            });
        }, this);
        this.getForm().setValues(values);
    },
    getFlatOptions : function(){
        var values = this.getForm().getValues();
        var options = {
            from     : values[this.rmnType + '-from'],
            nbCols   : values[this.rmnType + '-nbCols'],
            before   : values[this.rmnType + '-before'],
            lineTpl  : values[this.rmnType + '-lineTpl'],
            joinWith : values[this.rmnType + '-joinWith'],
            after    : values[this.rmnType + '-after']
        };
        return options;
    },
    getOptions : function(){
        var values = this.getForm().getValues();
        var options = {
            nbCols : values[this.rmnType + '-nbCols'],
            template : {
                before   : values[this.rmnType + '-before'],
                lineTpl  : values[this.rmnType + '-lineTpl'],
                joinWith : values[this.rmnType + '-joinWith'],
                after    : values[this.rmnType + '-after']
            }
        };
        options['from' + values[this.rmnType + '-from']] = true;

        return options;
    }
});
Ext.reg('options-panel', Ext.rmn.OptionsPanel);
