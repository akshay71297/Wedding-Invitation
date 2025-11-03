/**
 * @author Vinit Shahdeo <vinitshahdeo@gmail.com>
 */
(function ($) {
    /** Polyfills and prerequisites **/

    // requestAnimationFrame Polyfill
    var lastTime    = 0;
    var vendors     = ['webkit', 'o', 'ms', 'moz', ''];
    var vendorCount = vendors.length;

    for (var x = 0; x < vendorCount && ! window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame  = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if ( ! window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime   = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));

            var id   = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;

            return id;
        };
    }

    if ( ! window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

    // Prefixed event check
    $.fn.prefixedEvent = function(type, callback) {
        for (var x = 0; x < vendorCount; ++x) {
            if ( ! vendors[x]) {
                type = type.toLowerCase();
            }

            el = (this instanceof jQuery ? this[0] : this);
            el.addEventListener(vendors[x] + type, callback, false);
        }

        return this;
    };

    // Test if element is in viewport
    function elementInViewport(el) {

        if (el instanceof jQuery) {
            el = el[0];
        }

        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
    }

    // Random array element
    function randomArrayElem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Random integer
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Actual plugin code **/
    $.fn.sakura = function (event, options) {

        // Target element
        var target = this.selector == "" ? $('body') : this;

        // Defaults for the option object, which gets extended below
        var defaults = {
            blowAnimations: ['blow-soft-left', 'blow-medium-left', 'blow-soft-right', 'blow-medium-right'],
            className: 'sakura',
            fallSpeed: 0.5,  // Reduced fall speed
            maxSize: 14,
            minSize: 10,
            newOn: 500,      // Increased delay between new petals
            swayAnimations: ['sway-0', 'sway-1', 'sway-2', 'sway-3', 'sway-4', 'sway-5', 'sway-6', 'sway-7', 'sway-8']
        };

        var options = $.extend({}, defaults, options);

        // Default or start event
        if (typeof event === 'undefined' || event === 'start') {

            // Set the overflow-x CSS property on the target element to prevent horizontal scrollbars
            target.css({ 'overflow-x': 'hidden' });

            // Function that inserts new petals into the document
            var petalCreator = function () {
                if (target.data('sakura-anim-id')) {
                    setTimeout(function () {
                        requestAnimationFrame(petalCreator);
                    }, options.newOn);
                }

                // Get one random animation of each type and randomize fall time of the petals
                var blowAnimation = randomArrayElem(options.blowAnimations);
                var swayAnimation = randomArrayElem(options.swayAnimations);
                // Calculate fall time with a minimum duration and smoother randomization
                var minFallTime = 15; // Minimum fall time in seconds
                var fallTime = Math.max(
                    minFallTime,
                    Math.min(((document.documentElement.clientHeight * 0.01) + (Math.random() * 8)) * options.fallSpeed, 35)
                );

                // Build animation with gentler timing
                var animations =
                    'fall ' + fallTime + 's linear 0s 1' + ', ' +
                        blowAnimation + ' ' + (Math.min(fallTime + 5, 30) + randomInt(0, 5)) + 's ease-in-out 0s infinite' + ', ' +
                        swayAnimation + ' ' + randomInt(4, 8) + 's ease-in-out 0s infinite';

                // Create petal and randomize size
                var petal  = $('<div class="' + options.className + '" />');
                var height = randomInt(options.minSize, options.maxSize);
                var width  = height - Math.floor(randomInt(0, options.minSize) / 3);

                // Apply Event Listener to remove petals that reach the bottom of the page
                petal.prefixedEvent('AnimationEnd', function () {
                    $(this).remove(); // Always remove when fall animation ends
                })
                // Apply Event Listener to remove petals that finish their horizontal float animation
                .prefixedEvent('AnimationIteration', function (ev) {
                    if ($.inArray(ev.animationName, options.blowAnimations) != -1 ||
                        $.inArray(ev.animationName, options.swayAnimations) != -1) {
                        // Remove if petal has moved significantly out of view
                        var rect = this.getBoundingClientRect();
                        if (rect.right < 0 || rect.left > window.innerWidth ||
                            rect.bottom < 0 || rect.top > window.innerHeight + 100) {
                            $(this).remove();
                        }
                    }
                })
                // Add a backup timeout to remove the petal
                .each(function() {
                    var $petal = $(this);
                    setTimeout(function() {
                        $petal.remove();
                    }, fallTime * 1000 + 5000); // 5 seconds after fall should complete
                })
                .css({
                    '-webkit-animation': animations,
                    animation: animations,
                    'border-radius': randomInt(options.maxSize, (options.maxSize + Math.floor(Math.random() * 10))) + 'px ' + randomInt(1, Math.floor(width / 4)) + 'px',
                    height: height + 'px',
                    left: (Math.random() * document.documentElement.clientWidth - 100) + 'px',
                    'margin-top': (-(Math.floor(Math.random() * 20) + 15)) + 'px',
                    width: width + 'px'
                });

                target.append(petal);
            };

            // Finally: Start adding petals
            target.data('sakura-anim-id', requestAnimationFrame(petalCreator));

        }
        // Stop event, which stops the animation loop and removes all current blossoms
        else if (event === 'stop') {

            // Cancel animation
            var animId = target.data('sakura-anim-id');

            if (animId) {
                cancelAnimationFrame(animId);
                target.data('sakura-anim-id', null);
            }

            // Remove all current blossoms
            setTimeout(function() {
                $('.' + options.className).remove();
            }, (options.newOn + 50));

        }
    };
}(jQuery));

$(document).ready(function() {
    $('body').sakura('start', {
        fallSpeed: 0.3,      // Even slower fall speed
        newOn: 600,         // More time between new petals
        minSize: 8,         // Slightly smaller minimum size
        maxSize: 12         // Slightly smaller maximum size
    });
});

// Set the date we're counting down to
var countDownDate = new Date("Dec 6, 2025 19:00:00").getTime();

// Update the count down every 1 second
var x = setInterval(function() {

    // Get todays date and time
    var now = new Date().getTime();
    
    // Find the distance between now and the count down date
    var distance = countDownDate - now;
    
    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Output the result in an element with id="demo"
    document.getElementById("time").innerHTML = "<div class='container'><div class='days block'>"+ days + "<br>Days</div>" + "<div class='hours block'>" + hours + "<br>Hours</div>" + "<div class='minutes block'>" + minutes + "<br>Minutes</div>" + "<div class='seconds block'>" + seconds + "<br>Seconds</div></div>";
    
    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("time").innerHTML = "Bless the married couple for happy life!";
    }
}, 1000);

// being a bit cool :p  
var styles = [
    'background: linear-gradient(#D33106, #571402)'
    , 'border: 4px solid #3E0E02'
    , 'color: white'
    , 'display: block'
    , 'text-shadow: 0 2px 0 rgba(0, 0, 0, 0.3)'
    , 'box-shadow: 0 2px 0 rgba(255, 255, 255, 0.4) inset, 0 5px 3px -5px rgba(0, 0, 0, 0.5), 0 -13px 5px -10px rgba(255, 255, 255, 0.4) inset'
    , 'line-height: 40px'
    , 'text-align: center'
    , 'font-weight: bold'
    , 'font-size: 32px'
].join(';');

var styles1 = [
    'color: #FF6C37'
    , 'display: block'
    , 'text-shadow: 0 2px 0 rgba(0, 0, 0, 1)'
    , 'line-height: 40px'
    , 'font-weight: bold'
    , 'font-size: 32px'
].join(';');

var styles2 = [
    'color: teal'
    , 'display: block'
    , 'text-shadow: 0 2px 0 rgba(0, 0, 0, 1)'
    , 'line-height: 40px'
    , 'font-weight: bold'
    , 'font-size: 32px'
].join(';');
