'use strict';
angular.module('waterAnalysisApp')
.controller('MainCtrl', function ($scope,  $http, $location, leafletData) {
  $scope.alertMessage = "No location specified";
  $scope.alertClass = "alert-warning";
  $scope.wellresults = [];
  $scope.welldetails = [];
  $scope.headers = ['Analyte Type','Chemical Name','Concentration','Qualifier','Detection Limit','Water Quality Standard'];
  $scope.selectedIndex = 0;
  $scope.defaults = {
    maxZoom: 16
  };
  $scope.wells = null;
  $scope.property = null;
  $scope.selectedResult = null;

  $scope.map = null;;
  $scope.center = {
    lat: 35.780556,
    lng: -78.638889,
    zoom: 13
  };

    var hour = new Date().getHours();
    console.log(hour);
    var baseUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

  $scope.tiles = {
    url: baseUrl,
    minZoom: 4,
    maxZoom: 16,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }
  $scope.legend = {
    url: "https://maps.raleighnc.gov/arcgis/rest/services/Environmental/Wells/MapServer/legend?f=json",
    legendClass: "info legend",
    position: "bottomleft",
  };
  $scope.$on('leafletDirectiveMap.click', function(event, args){

    $scope.wells.identify().tolerance(20).on(args.leafletEvent.target).at(args.leafletEvent.latlng).run(function (error, featureCollection) {
      if (featureCollection.features.length > 0) {
        $scope.getWellResults(featureCollection.features[0].properties.PIN);
      }
    });
  });

  $(".legend").load(function () {
    $(".legend").appendTo('.col-sm-4');
  });

  leafletData.getMap().then(function (map) {
    $scope.map = map;
    $scope.wells = L.esri.dynamicMapLayer('https://maps.raleighnc.gov/arcgis/rest/services/Environmental/Wells/MapServer').addTo(map);

  });


  var address = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.num); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
    	url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/AutoComplete?input=%QUERY&type=address&f=json',
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
    	url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/AutoComplete?input=%QUERY&type=pin&f=json',
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
      $http.get('https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/RealEstateSearch?type=address&values=['+address+']&f=json').success(
        function (data) {
          if (data.Accounts.length > 0) {
            $scope.getWellResults(data.Accounts[0].pin);
          }
        }
        );
    }

    $scope.getWellResults = function (pin) {
      $scope.zoomToProperty(pin);
      $http.get('https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/WellResults?pin='+pin+'&f=json').success(
        function (data) {
          $scope.welldetails = [];
          $scope.wellresults = data.WellResults;
          if (data.WellResults.length > 0) {
            $scope.alertClass = "alert-success";
            $scope.alertMessage = data.WellResults.length + ' sampling results found for this location';
            $scope.selectedResult = data.WellResults[0];
            $scope.getWellDetails(data.WellResults[0].permit, data.WellResults[0].code);
          } else {
            $scope.alertClass = "alert-danger";
            $scope.alertMessage = "No sampling results found for this location";
          }
        }
        );
    }

    $scope.getWellDetails = function (permit, code) {
      $http.get('https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/WellDetails?permit='+permit+'&code='+code+'&f=json').success(
        function (data) {
          $scope.welldetails = data.WellDetails;
        }
        );
    }

    $scope.zoomToProperty = function (pin) {
      var query = L.esri.Tasks.query('https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/0').where("PIN_NUM = '" + pin + "'").run(function (error, featureCollection) {
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

    $scope.permitClicked = function ($index, permit) {
      $scope.selectedIndex = $index;
      $scope.getWellDetails(permit.permit, permit.code);
      $scope.selectedResult = permit;
    }

    $scope.print = function () {
      var dd = {

        content: [
        {
          image: 'data:image/jpeg;base64,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'
        },
        {
          style: 'header',
          text: 'Water Quality Data'
        },'\n',
        {
          alignment: 'justify',
          columns: [
          {
            text: 'Permit #'
          },
          {
            text: $scope.selectedResult.permit
          }
          ]
        },
        {
          alignment: 'justify',
          columns: [
          {
            text: 'Inspection Code'
          },
          {
            text: $scope.selectedResult.code
          }
          ]
        },
        {
          alignment: 'justify',
          columns: [
          {
            text: 'Sample Date'
          },
          {
            text: $scope.selectedResult.sampledOn
          }
          ]
        },'\n',
        {
          style: 'table',
          table: {
            body: [
            []
            ]
          }
        },'\n',
        {
          style: 'table',
          table: {
            body: [
            ['Qualifier', 'Description'],
            ['<', 'Compound not quantified above detection limits'],
            ['B (organic)', 'Analyte found in associated blank'],
            ['J', 'Value is estimated'],
            ['NA', 'Not analyzed'],
            ['ND', 'Compound not quantified above detection limits'],
            ['R', 'Sample was rejected per quality control'],
            ['U', 'Compound was analyzed for but not detected'],
            ]
          }
        },
        {
          style: 'header',
          text: 'Wake County Environmental Services Guide to understanding your inorganic water sample results',
          pageBreak: 'before'
        },'\n',
        {
          style: 'guide',
          table: {
            body: [
            ['Parameter', "MCL's *EPA Primary Standards", "Potential Health Effects from Ingestion of Water containing substance in levels above MCL's", "Potential Health Effects from Ingestion of Water containing substance in levels above MCL's Aesthetic limits #EPA Secondary Standards", 'Potential Effects from water usage', 'Treatment'],
            ['Acid water(low pH)', '', 'Generally does not present a health risk', '6.5-8.5', 'Bitter metallic taste, corrosion of pipes', 'Neutralizer'],
            ['Alkalinity', 'No limit', 'Weak acid solution with feed pump and flow meter', '', '', 'Neutralizer'],
            ['Arsenic', '0.010', 'Skin damage or problems with circulatory systems, and may have increased risk of getting cancer', '', '', 'Reverse Osmosis system'],
            ['Barium', '2.0', 'Increase in blood pressure', '', '', 'Reverse Osmosis system'],
            ['Calcium', 'No limit', '', '', '', ''],
            ['Cadmium', '0.005', 'Increase in blood pressure', '', '', 'Reverse Osmosis system'],
            ['Chloride', '', '', '250', 'Salty taste', 'Reverse Osmosis system'],
            ['Chromium', '', 'Increase in blood pressure', '', '', 'Reverse Osmosis system'],
            ['Fluoride', '', 'Bone disease (pain and tenderness of the bones); Children may get mottled teeth', '2.0', 'Tooth discoloration', 'Reverse Osmosis system'],
            ['Copper', '', 'Short term exposure: Gastrointestinal distress. Long term exposure: Liver or kidney damage', '1.0', 'Metallic taste, blue green staining', 'Reverse Osmosis system'],
            ['Hardness', 'No limit', 'Generally does not present a health risk', '', '', 'Water Softener'],
            ['Iron', '', '', '0.3', 'Orange staining, metallic taste', 'Softener/iron precipitation and then filtration.'],
            ['Lead', '', 'Infants and children: Delays in physical or mental development; Adults: Kidney problems; high blood pressure', '', '', 'Reverse Osmosis system'],
            ['Magnesium', 'No limit', '', '', '', 'Reverse Osmosis system'],
            ['Manganese', '', '', '0.05', 'Black staining, metallic taste', 'Flushing of pipes or Reverse Osmosis System'],
            ['Mercury', '', 'Kidney damage', '', '', 'Reverse Osmosis system'],
            ['Nitrate/Nitrite', '', 'Infants below the age of six months who drink water containing nitrate in excess of the MCL could become seriously ill and, if untreated, may die. Symptoms include shortness of breath and blue-baby syndrome', '', '', 'Reverse Osmosis system'],
            ['Selenium', '', 'Hair or fingernail loss; numbness in fingers or toes; circulatory problems', '', '', 'Reverse Osmosis system'],
            ['Sodium', 'No limit', '', '', '', 'Reverse Osmosis system'],
            ['Zinc', '', '', '5.0', 'Metallic taste', 'Flushing of pipes or Reverse Osmosis System']
            ]
          }
        },
        {
          style: 'guide',
          text: 'Note: It is recommended that the homeowner be diligent in finding the best treatment for a particular water problem.'
        },
        {
          style: 'guide',
          text: 'Please contact Wake County Environmental Services at: 919-856-7400 with questions.'
        },
        {
          style: 'guide',
          text: '* MCL = Maximum Contaminant Level (water considered safe to consume) measured in mg/l'
        }
        ],
        styles: {
          header: {
            fontSize: 14,
            bold: true
          },
          guide: {
            fontSize: 8
          }
        }
      };
      angular.forEach($scope.headers, function (header) {
        dd.content[7].table.body[0].push(header);
      });
      angular.forEach($scope.welldetails, function (detail) {
        dd.content[7].table.body.push([detail.analyteType,detail.chemName,detail.concentration+detail.unit,detail.qualDesc,detail.limit+detail.unit,detail.epi+detail.epiUnit]);
      });
      pdfMake.createPdf(dd).open();
    }
    $scope.countResults = function () {
      return $scope.wellresults.length === 0;
    }
    if ($location.search().pin) {
      $scope.getWellResults($location.search().pin);
    }
  });
