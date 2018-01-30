// If you are using jQuery, use < $(document).ready(function(){ ... }) > instead
document.addEventListener("DOMContentLoaded", function(){

	// The DOM-element which will hold the playfield
	// If you are using jQuery, you can use < var element = $("#parent"); > instead
	var parentElement = document.getElementById("parent");

	// User defined settings overrides default settings.
	// See snake-js.js for all available options.
	var settings = {
		    frameInterval : 120,
		    backgroundColor : "#f3e698"
	};

	// Create the game object. The settings object is NOT required.
	// The parentElement however is required
	var game = new SnakeJS(parentElement, settings);

    // game.move(37);//left
     game.move(38);//up
    // game.move(39);//right
    // game.move(40);//down

}, true);