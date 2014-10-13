'use strict';

/**
 * @ngdoc function
 * @name waterAnalysisApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the waterAnalysisApp
 */
angular.module('waterAnalysisApp')
  .controller('MainCtrl', function ($scope,  $http, $location, leafletData) {

    $scope.wellresults = [];
    $scope.welldetails = [];
    $scope.map = null;;
    $scope.center = {
          lat: 35.780556,
          lng: -78.638889,
          zoom: 13
        };
    $scope.defaults = {
      maxZoom: 16
    };
    $scope.wells = null;
    $scope.property = null;

    leafletData.getMap().then(function (map) {
      $scope.map = map;
      $scope.wells = L.esri.dynamicMapLayer('http://maps.raleighnc.gov/arcgis/rest/services/Environmental/Wells/MapServer').addTo(map);
      map.on('click', function (e) {
        $scope.wells.identify().on(map).at(e.latlng).run(function (error, featureCollection) {
          if (featureCollection.features.length > 0) {
            $scope.getWellResults(featureCollection.features[0].properties.PIN_NUM);
          }
        });
      });
    });
    


    $scope.tiles = {
      url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    }



  var address = new Bloodhound({


    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.num); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
    	url: 'http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/AutoComplete?input=%QUERY&type=address&f=json',
    	filter: function (resp) {
    		var values = [];
    		angular.forEach(resp.Results, function (result) {
    			values.push({value: result, type: 'address'});
    		});
    		return values;
    	}
    }
  });

   var pin = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.num); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
    	url: 'http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/AutoComplete?input=%QUERY&type=pin&f=json',
    	filter: function (resp) {
    		var values = [];
    		angular.forEach(resp.Results, function (result) {
    			values.push({value: result, type: 'pin'});
    		});
    		return values;
    	}
    }
  });


 address.initialize();
 pin.initialize();

  $scope.typeaheadOptions = {
    highlight: true
  };

  $scope.typeaheadData = [
    {
      name: 'Address',
      displayKey: 'value',
      source: address.ttAdapter()   // Note the nba Bloodhound engine isn't really defined here.
    },
    {
      name: 'PIN',
      displayKey: 'value',
      source: pin.ttAdapter()   // Note the nhl Bloodhound engine isn't really defined here.
    }
  ];
  $scope.foo = {};


   $scope.$watch("foo", function (newValue, oldValue) {
    if (newValue.value) {
      $scope.typeaheadSelected(newValue.value, newValue.type);
    }
   });

   $scope.getPinFromAddress = function (address) {
    $http.get('http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/RealEstateSearch?type=address&values=['+address+']&f=json').success(
      function (data) {
        if (data.Accounts.length > 0) {
          $scope.getWellResults(data.Accounts[0].pin);
        }
      }
    );
   }

   $scope.getWellResults = function (pin) {
    $scope.zoomToProperty(pin);
    $http.get('http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/WellResults?pin='+pin+'&f=json').success(
      function (data) {
        $scope.welldetails = [];
        $scope.wellresults = data.WellResults;
        console.log($scope.wellresults);
        if (data.WellResults.length > 0) {
          $scope.getWellDetails(data.WellResults[0].permit, data.WellResults[0].code);
        }
      }
    );
   }

  $scope.getWellDetails = function (permit, code) {
    $http.get('http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/WellDetails?permit='+permit+'&code='+code+'&f=json').success(
      function (data) {
        $scope.welldetails = data.WellDetails;
        console.log($scope.welldetails);
      }
    );
   }

   $scope.zoomToProperty = function (pin) {
    var query = L.esri.Tasks.query('http://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0').where("PIN_NUM = '" + pin + "'").run(function (error, featureCollection) {
      if ($scope.property) {
        $scope.property.clearLayers();
      }
      
      $scope.property = L.geoJson(featureCollection).addTo($scope.map);
      $scope.map.fitBounds($scope.property.getBounds());
    });
   }

   $scope.typeaheadSelected = function (value, type) {
    if (type === 'address') {
      $scope.getPinFromAddress(value);
    } else if (type === 'pin') {
      $scope.getWellResults(value);
    }
   }

   $scope.permitClicked = function (permit) {
    $scope.getWellDetails(permit.permit, permit.code);
   }

   if ($location.search().pin) {
    $scope.getWellResults($location.search().pin);
   }





    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma',
      'SitePoint'
    ];
  });
