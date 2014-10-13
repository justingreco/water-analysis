'use strict';

/**
 * @ngdoc function
 * @name waterAnalysisApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the waterAnalysisApp
 */
angular.module('waterAnalysisApp')
  .controller('MainCtrl', function ($scope,  $http, $location) {

    $scope.wellresults = [];
    $scope.welldetails = [];


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




  // var numbers = new Bloodhound({
  //   datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.num); },
  //   queryTokenizer: Bloodhound.tokenizers.whitespace,
  //   local: [
  //     { num: 'one' },
  //     { num: 'two' },
  //     { num: 'three' },
  //     { num: 'four' },
  //     { num: 'five' },
  //     { num: 'six' },
  //     { num: 'seven' },
  //     { num: 'eight' },
  //     { num: 'nine' },
  //     { num: 'ten' }
  //   ]
  // });

  // initialize the bloodhound suggestion engine
 // numbers.initialize();

 address.initialize();
 pin.initialize();

  // Allows the addition of local datum
  // values to a pre-existing bloodhound engine.
 /* $scope.addValue = function () {
    numbers.add({
      num: 'twenty'
    });
  };*/

  // Typeahead options object
  $scope.typeaheadOptions = {
    highlight: true
  };

  // Single dataset example
  // $scope.typeaheadData = {
  //   displayKey: 'num',
  //   source: numbers.ttAdapter()
  // };

  // Multiple dataset example
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
    $http.get('http://mapstest.raleighnc.gov/arcgis/rest/services/Parcels/MapServer/exts/PropertySOE/WellResults?pin='+pin+'&f=json').success(
      function (data) {
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

   $scope.typeaheadSelected = function (value, type) {
    if (type === 'address') {
      $scope.getPinFromAddress(value);
    } else if (type === 'pin') {

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
