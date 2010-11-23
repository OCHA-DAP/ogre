var vows = require('vows'),
    assert = require('assert'),
    childp = require('child_process');
 
var testUrl = 'http://localhost:3001/convert';
    
process.on("exit",function(){
    ogre.kill('SIGHUP');
});

function curl(params){
    return function(){
        var callback = this.callback;
        childp.exec('curl -s ' + params.join(' ') + ' ' + testUrl,{maxBuffer: 1024 * 7500},function(e,data){
            if(data.charAt(0) == "{") data = JSON.parse(data);
            callback(e,data);
        });
    }
}

function assertGeoJSON(e,data){
    assert.equal(data.type,"FeatureCollection");
}

vows.describe('Ogre').addBatch({
    'set up': {
        topic: function(){
            ogre = childp.spawn('node',['app.js',3001]);
            setTimeout(this.callback,1000);
        },
        
        'should set a pid': function(){
            assert.isNumber(ogre.pid);
        }
    }
}).addBatch({
    'when no file is provided': {
        topic: curl(['-d','""']),
        
        'should indicate an error': function(e,data){
            assert.isTrue(data.error);
        },
        'should give an error message': function(e,data){
            assert.equal(data.message,"No file provided.  Ogre sad");
        }
    },
    'when a json callback is provided': {
        topic: curl(['-F','"upload=@test/samples/sample.csv"','-F','"callback=test123"']),
        
        'data should start with <callback>(': function(e,data){
            assert.match(data,/^test123\(/);
        },
        'data should end with );': function(e,data){
            assert.match(data,/\);$/);
        }
    },
    'when uploaded an invalid file': {
        topic: curl(['-F','"upload=@test/samples/sample.bad"']),
        
        'should indicate an error': function(e,data){
            assert.isTrue(data.error);
        },
        'should give an error message': function(e,data){
            assert.equal(data.message,"Ogre can't transform files of type: bad");
        }
    },
    'when uploading a BNA file (.bna)': {
        topic: curl(['-F','"upload=@test/samples/sample.bna"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a CVS file (.csv)': {
        topic: curl(['-F','"upload=@test/samples/sample.csv"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a DGN file (.dgn)': {
        topic: curl(['-F','"upload=@test/samples/sample.dgn"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a DXF file (.dxf)': {
        topic: curl(['-F','"upload=@test/samples/sample.dxf"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a ESRI ShapeFile (.shp)': {
        topic: curl(['-F','"upload=@test/samples/sample.shp"']),
        
        'should indicate an error': function(e,data){
            assert.isTrue(data.error);
        },
        'should give an error message': function(e,data){
            assert.equal(data.message,"Ogre can't transform files of type: shp");
        }
    },
    'when uploading a ESRI ShapeFile (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.shp.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a GeoConcept file (.gxt)': {
        topic: curl(['-F','"upload=@test/samples/sample.gxt"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a GeoJSON file (.json)': {
        topic: curl(['-F','"upload=@test/samples/sample.json"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a GeoRSS file (.rss)': {
        topic: curl(['-F','"upload=@test/samples/sample.rss"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a GML file (.gml)': {
        topic: curl(['-F','"upload=@test/samples/sample.gml"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a GML file (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.gml.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a GMT file (.gmt)': {
        topic: curl(['-F','"upload=@test/samples/sample.gmt"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    /*'when uploading a GPX file (.gpx)': {
        topic: curl(['-F','"upload=@test/samples/sample.gpx"']),
        
        'should return GeoJSON': assertGeoJSON
    },*/
    'when uploading a Iterlis 1 file (.itf)': {
        topic: curl(['-F','"upload=@test/samples/sample.itf"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a Iterlis 1 file (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.itf.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a KML file (.kml)': {
        topic: curl(['-F','"upload=@test/samples/sample.kml"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a KML file (.kmz)': {
        topic: curl(['-F','"upload=@test/samples/sample.kmz"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a MapInfo file (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.map.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    /*'when uploading a S-57 file (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.s57.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    },
    'when uploading a TIGER file (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    },*/
    'when uploading a VRT file (.zip)': {
        topic: curl(['-F','"upload=@test/samples/sample.vrt.zip"']),
        
        'should return GeoJSON': assertGeoJSON
    }
}).addBatch({
    'tear down': {
    	topic: function(){
    	    ogre.on('exit',this.callback);
    	    ogre.kill('SIGHUP');
    	},
    	
    	'should return killed == true': function(){
    	    assert.isTrue(ogre.killed);
    	}
    }
}).export(module);
