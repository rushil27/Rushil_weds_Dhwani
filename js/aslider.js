var aslider = {
    // Each slider is stored in this as {currentSlide: xx, timeoutHandle: yy}
    sliders: [],

    initAsliders: function () {
        'use strict';

        // Get each slider element and process it
        var sliders = document.querySelectorAll('.aslider');
        for (var i = 0; i < sliders.length; i++) {

            var currentSlider = sliders[i];

            // Create an object to represent slider state
            var sliderObject = {};
            var sliderIndex = aslider.sliders.push(sliderObject) - 1;

            sliderObject.sliderContainer = sliders[i];
            sliderObject.muted = false;

            // Normalise each slider
            var style = currentSlider.getAttribute('style');
            currentSlider.setAttribute('style', (style)?style+';position:relative':'position:relative');

            // If we should show the play and mute controls, do so now
            if (! currentSlider.hasAttribute('data-hide-mute') &&
                    ! currentSlider.hasAttribute('data-hide-controls')) {
                // Add audio/mute icon
                var muteButton = document.createElement('a');
                muteButton.setAttribute('class', aslider.muteButtonClass);
                muteButton.setAttribute('style', aslider.muteIconStyle);
                muteButton.setAttribute('data-state', 100);
                muteButton.setAttribute('onclick', 'aslider.toggleAudio(' + sliderIndex + ')');
                var muteIcon = document.createElement('img');
                muteIcon.setAttribute('src', aslider.audioLoudIcon);
                muteIcon.setAttribute('style', 'width: inherit; height: inherit;');
                muteButton.appendChild(muteIcon);
                currentSlider.appendChild(muteButton);
                // Having the onclick handler appended this way neatly resolves potential memory leaks if the page
                // will be modified by outside scripts.
            }

            if (! currentSlider.hasAttribute('data-hide-pause') &&
                ! currentSlider.hasAttribute('data-hide-controls')) {
                // Add play-pause icon
                var pauseButton = document.createElement('a');
                pauseButton.setAttribute('style', aslider.playPauseIconStyle);
                pauseButton.setAttribute('class', aslider.pauseButtonClass);
                pauseButton.setAttribute('data-state', 'play');
                pauseButton.setAttribute('onclick', 'aslider.toggleState(' + sliderIndex + ')');
                var pauseIcon = document.createElement('img');
                pauseIcon.setAttribute('src', aslider.pauseIcon);
                pauseIcon.setAttribute('style', 'width: inherit; height: inherit');
                pauseButton.appendChild(pauseIcon);
                currentSlider.appendChild(pauseButton);
            }

            var slides = currentSlider.querySelectorAll('.aslide');

            for (var j = 0; j < slides.length; j++) {
                var slide = slides[j];

                slide.setAttribute('style', aslider.slideFade + ";" + aslider.slideFadeOut);
                if (slide.hasAttribute('data-audio')) {
                    var audioElement =  document.createElement('audio');
                    audioElement.setAttribute('src', slide.getAttribute('data-audio'));
                    audioElement.setAttribute('preload', '');
                    if (slide.hasAttribute('data-audio-loop')) {
                        audioElement.setAttribute('loop', '');
                    }
                    slide.appendChild(audioElement);
                }
            }

            if (slides.length > 0) { // Don't crap out if no slides specified
                var duration = slides[0].getAttribute('data-duration') || currentSlider.getAttribute('data-duration');
                if (!duration) throw ("Could not find duration on slide or on slider.");

                slides[0].setAttribute('style', aslider.slideFade + ";" + aslider.slideFadeIn);
                sliderObject.timeoutHandle = setTimeout(function (sliderIndex, slides) {
                    aslider.advanceSlide(slides[0], sliderIndex);
                }, parseInt(duration) * 1000, sliderIndex, slides);
                sliderObject.currentSlide = slides[0];

                aslider._playAudio(sliderIndex);
            }
        }
    },

    advanceSlide: function (currentSlide, sliderIndex) {
        'use strict';
        console.log('Advance', sliderIndex)
        var nextSlide = currentSlide.nextElementSibling;
        var slider = aslider.sliders[sliderIndex].sliderContainer;

        if (!nextSlide ||! /aslide/.test(nextSlide.className)) { // Loop to the first slide if we are on the last slide now
            nextSlide = currentSlide.parentNode.querySelector('.aslide');
        }

        currentSlide.setAttribute('style', aslider.slideFade + ";" + aslider.slideFadeOut);
        nextSlide.setAttribute('style', aslider.slideFade + ";" + aslider.slideFadeIn);

        // Cancel playing audio
        aslider._pauseAudio(sliderIndex);

        aslider.sliders[sliderIndex].currentSlide = nextSlide;

        // Play new audio
        aslider._playAudio(sliderIndex);

        //slider.clientHeight($(nextSlide).height());

        var duration = nextSlide.getAttribute('data-duration') || slider.getAttribute('data-duration');
        if (!duration) throw ("Could not find duration on slide or on slider.");

        aslider.sliders[sliderIndex].timeoutHandle = setTimeout(function () {
            aslider.advanceSlide(nextSlide, sliderIndex);
        }, parseInt(duration) * 1000);
    },

    _playAudio: function(slideIndex) {
        // Given a slideshow, plays the audio for the current slide if present and not muted
        'use strict';
        if (aslider.sliders[slideIndex].muted === false) {
            aslider.sliders[slideIndex].currentSlide.querySelector('audio').play();
        }
    },

    _pauseAudio: function(slideIndex) {
        // Given a slideshow, pauses the audio for the current slide
        'use strict';
        aslider.sliders[slideIndex].currentSlide.querySelector('audio').pause();
    },

    toggleAudio: function (sliderIndex) {
        // Turn on/off audio for a given slider
        'use strict';

        var slider = aslider.sliders[sliderIndex].sliderContainer;
        var muteButton = slider.querySelector('.'+aslider.muteButtonClass);

        if (aslider.sliders[sliderIndex].muted) {

            muteButton.querySelector('img').setAttribute('src', aslider.audioLoudIcon);
            muteButton.setAttribute('data-state', '100');
            aslider.sliders[sliderIndex].muted = false;
            aslider._playAudio(sliderIndex);

        } else {

            muteButton.querySelector('img').setAttribute('src', aslider.audioMuteIcon);
            muteButton.setAttribute('data-state', '0');
            aslider.sliders[sliderIndex].muted = true;
            aslider._pauseAudio(sliderIndex);

        }
    },

    toggleState: function (sliderIndex) {
        // Toggles the Paused/playing state of a slider
        'use strict';

        var slider = aslider.sliders[sliderIndex].sliderContainer;

        var pauseButton = slider.querySelector('.'+aslider.pauseButtonClass);

        if (pauseButton.getAttribute('data-state') === 'play') { // If the slider is playing, pause it

            pauseButton.querySelector('img').setAttribute('src', aslider.playIcon);// Change button icon from pause to play
            pauseButton.setAttribute('data-state', 'pause');
            clearTimeout(aslider.sliders[sliderIndex].timeoutHandle); // Stop advancing to next slide
            aslider._pauseAudio(sliderIndex);// pause audio

        } else { // If on the other hand the slider is paused, start playing

            pauseButton.querySelector('img').setAttribute('src', aslider.pauseIcon); // Change pause button icon to pause icon
            pauseButton.setAttribute('data-state', 'play');
            // Start advancing slides
            aslider.sliders[sliderIndex].timeoutHandle = setTimeout(function () {
                aslider.advanceSlide(aslider.sliders[sliderIndex].currentSlide, sliderIndex);
            }, parseInt(aslider.sliders[sliderIndex].currentSlide.getAttribute('data-duration')) * 1000);
            aslider._playAudio(sliderIndex);// unpause audio

        }
    },

    stop: function() {
        'use strict';
        while (aslider.sliders.length > 0) {
            var slider = aslider.sliders.pop();
            clearTimeout(slider.timeoutHandle);
        }

    },

    init: function () {
        'use strict';
        aslider.stop();
        if (window.addEventListener) {
            window.addEventListener('load', this.initAsliders, false);
        } else if (window.attachEvent) { // IE
            window.attachEvent('onload', this.initAsliders);
        }
    },

    // TODO: Test adding sliders dynamically with AngularJs
    // TODO: Write documentation for Angular

    // TODO: Improve positioning

    // TODO: Create Bower packages
    // TODO: Update documentation with bower instructions and js file download

    // TODO: Addnext/prev buttons
    // TODO: Remove jQuery
    // TODO: Test on various browsers (Monday)
    // TODO: Update

    /*
     Take a HTML page
     Add AngularJs
     Do ng-repeat to create a new slider
     Use aslider.init() and ensure everything works
     Copy-paste code above to add another slider
     Repeat
     Now remove a slider
     Does everything still work well?
     Add support for refreshing and restarting sliders
     */

    /* Configuration */
    slideFade: "display: block; opacity: 1; top: 0; position: absolute; left: 0; overflow: hidden; transition: opacity 1s ease-in-out; -moz-transition: opacity 1s ease-in-out; -webkit-transition: opacity 1s ease-in-out;",
    slideFadeOut: "opacity: 0",
    slideFadeIn: "opacity: 1",
    slideSlide: "",
    slideSlideOut: "",
    slideSlideIn: "",
    audioLoudIcon: "data:image/png;base64,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",
    audioMuteIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAbYAAAGACAYAAADBKkfAAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAABrhSURBVHja7N0LcxzXmR5gTM/9PhgAFCVZ8Wp3/1U2u5XsOhtnk3VK/h2R1147XluRU/lfKsmyHFEmBcz9fksfEJQomZIoEA10N56naqpYYHGmcabZb39fnz5dOBwORwCQF5EhAECwAYBgAwDBBgCCDQDBBgCCDQAEGwAINgAQbAAINgAQbAAg2ABAsAGAYANAsAGAYAMAwQYAgg0ABBsAgg0ABBsACDYAEGwAINgAEGwAINgAQLABgGADAMEGgGADAMEGAIINAAQbAAg2AAQbAAg2ABBsACDYABBsACDYAECwAYBgAwDBBoBgAwDBBgCCDQAEGwAINgAEGwAINgAQbAAg2ABAsAEg2ABAsAGAYAMAwQYAgg0AwQYAmVIyBKTBfD7/+Xa7rRQKhX0URbtisbit1WrvGBng+yocDgejwK1bLpfvzueL7nK5qG3W2/Juty1+ZceMokOtVl3WavVlvV4bCzlAsJFaw+HwvfFo0t5uN+WXaiuUSttOtzPu9Xo/MnqAYCM15rP5LwaDwelqtape59/X6vVFv3/8WPUGCDbu3Gg0+s3gYtDf7/evNGGpUqmsT05PHtfr9Z8YVeBFTB4hUeFa2mQy6U/G0/bR0aufRK3X68rFxeDszTfrBhd4IdP9SUxoPZ5/fv5wMp7cSKg9s1ouqxcXF+8bYUCwcWtC6/Hx48cPr3s97TvffzjqLhaLfzHSwNdpRXKjrlqPx5PxtHOTVdrXHQ6HwmK+aNfrWpKAio2EhJusr1qPiYbaM7PZrGnUAcFGIsaj8b89/tOT11erdfXoqHB0G6/NZlvWjgS+TiuSV7Jarf7neBxmPYYq7fZtNpuqdiQg2LgRofU4GAzOVst19a62YbfdVXwTgGDjlY1H41/HoXay2+2Ld7ohhYIVBgDBxvWF1uPTG64n7cPh8mLXnYoKhZ1vBRBsXMvT1uPwbLVcVdOyTYWosPfNAIKN7208Hv96cJGC1iOAYONVff755/8nLa1HAMHGtYXW43AwPF0uVzWjAQg2Mu1p63F4stvttB4BwUa2nZ+f/248Gne0HgHBRqYtFosw6/F0uVhqPQKCjWybjCe/vric9aj1CAg2Mu78/OJ349FI6xEQbGSb1iMg2MiNyWTyvwYXg9PtVusREGxk3MX5xfuj0air9QgINjItPJQz3HC9WCw9wAwQbGSb1iMg2MgNrUdAsJELl63H4eh0MV9oPQKCjWx72nocnmy3W98xINjItouLi/dHw3H3cDhoPQKCjexaLBY/Gw1HZ3OtR0CwkXWTyfRXT2c9aj0Cgo2Mu2w9jsbdo/2hoPcICDYy61nr0axHAMGWedPp9FcX54PTndYjgGDLusHF4P3haHTZejQaAIIts5bL5bvD4fBsMVs0jAaAYMu00HqMK7WT7WZbNhoAgi3TBoPB/x4NR72D1iOAYMuyp63H0dliNtd6BBBs2TadTn95ecO11iOAYMs6rUcAwZYLofUYB9rpfDZvGg0AwZZpl63HwVXrUZ0GINiybDgYvjccDo89ZgZAsGXaZetxpPUIINhyILQe40rtdLPZmPUIINiybTgcvheHmtYjgGDLttB6HI/GJ7PZrGU0AARbpsVh9q+Di8GZ1iOAYMs8rUcAwZYLWo8Agi03tB4BBFtuDIejcMN177DfR0YDQLBlltYjgGDLjcvWY7jher2uGA0AwZZpo+Hot4Ow1qPWI4Bgy7LQepyMJyfT6VTrEUCwZdtsNvvFYDA803oEEGyZNxqNfjMcDPt7rUcAwZZlWo8Agi03QusxrtLO1lqPAIIt6562Hkf9/X6n9Qgg2LLrsvU4mfSnk2nbaAAItkybz+c/D2s9rtfrqtEAEGyZpvUIINhyIbQep5NpfzKZaD0CCLZsWywWP7+4uDhbr7QeAQRbxoXraefn569tN1vPTgMQbJmv1P7l/PPzh9vtVsgD5MC9nxwRnp8m1AAEWy6E2Y/z+bxhNwAQbLkwm87MfgTImW9swQ2Ho9+uV6vqZrOp7A+HQqIbUSxuy5XKplarzlut1j/dxi8+nU5/uYp/P7sAQM6DbTab/etoODq5zYP+drMpL5fL+nRSaK9W69+1Ws1htVp9J8nPXK/WWpAAOfSVVmS4l+v8/OK1u6pkDnFlOB6NuqPR6CTpz1rHYerrB8h5sA0Hw5Pddlu8642az+bN6WT6q6SrRF8/QI6DbT6f/yK0A9OwUaFym06n3SQ/w9OvAXIebKvVqpmmDdskfG/ZIeEJMQDccbBtN+m6SXkn2AB4lWDbH/b35kAfVvEXbAA5D7bD/pCqa06FQnRI6r33+33RVw+Q92BLWQVTiAqCDYDrB1t8sE9VsEWFwj6p945D3IxIgHtQsaWsFZlcxZa2tisAyQRbuiq2KFKxAXD9YNvv70/Ftj+4ORvgHlRs6brGVkj2Gpup/gB5DrY03teV5KxI19gAch5scailbvp7VEjuGptWJEDOgy2NCwJHUZRkxaYVCZDrii2FrTmTRwC4fsWWwgN9IUpw8oiKDSDnFdshlRVbgtfYBBuAYMtRsB08ZBQgt0pPD/Qh2NJVxCS88kghbb8vADdbsaXuKJ9sxeY+NoBcB1tKp/sneR+bcg0g18GWzoptl8T7Pl1lRR8SINfBlr51Io8OtVrtnUSqNQ8ZBci10tOD/SFKUw2T+CNr1GsAua/Y7s9DRj2LDeAeBFvKVuJINth86QC5D7a0STLY4mhTsQHkvmJL293KybYifesAOVa6OtqnK9cy/faQHcvl8oNarfbXN/V+T548Maiv6OzszCDcRLClroYpJJc97mHjvgbYer1urFbrxnazLe/3u+JuuyvtDvtisRBto1K0K0albalc2lSrlXm5XF7U6/W/Ehxfms/nH8Xj19xtt9Xdbldebzbl7XZbig8oh2KxuCuVSruoGI9jsbiuVqrTMJbxGP6lve9L0+n0D6vVqrXd7qpX+2AxHstiuPx0NYbbQhTt4v1vFu+Hi0aj8fYrVGzpOtgXEs1arUjuj8l48sf5Yt5dLJaNb5oRHMJtt9kXN0fbytEqHHyOumFJu7iSmzYa9XGn03njvo7fYrGIw2xVj1/txXxRf9Flm/Cz7W5XCq+rHzUmR9NeKT5Q1+q1cRxug1ar9cP7Ooaz2ez38dj1FstlM5wIfEPFUdjt91E4Wbj6SSsMdLwPLqq12qRWq06/z0nC1Yfco8e4qNi4J2fG08m0Hw4m1+tsHKL4oN4Mr9lsPmu3Wxfxwfmt+zSG4/H4j/EYnq3W68p1/n0cdMXpdNaexa94HMfNZvP8uhVIFs3ni4/m81kv/v2711ndKpQg8f5bC69KudyL979H3V739ZcOthS2IpObPOIaGzkWWo7xwfgkDrbe4ebes7GKX3HVN4wD7vObvCaXzgPy/KMQaLP5vHkT73e4PNGYteezebPT7Tw5Pj7O/UW00Wj0afx6sNvdzEpPoZK7GAwexicIi3gMP/uuE4R0Th5JNHq0Ismn+P/8h8Ph6LUQREn8r4nDsrvdbCrxWfOH8YEll9eO4uri4+Fw+PpzLbEbE1ctUfz9nO62u1Gz1byo1+u5rN4uzi/OR+NxP5F9PK7eNpvNW7vj3Sftdvutbw+2o7RdY0v0Bm0VG/k7IM9mvx8MBq9vNttKkp+zXK3qu/OLHxwOh983m82/yNMYTiaTTwaD4ethMkOinzOddsLkk/iPH+Zpckk4sYrH8Gw2m7eS/JzQ4o3D8839bv+NrckohQVbSLYkJ48INvJXqQ2GD5MOtWc22205hGj43LyMYVyNfnxxPngj6VB7Zr5Y1MfjcaiuczOGcbXbTzrUnqt+C3Fl/dpkPPnkm4MtZQf7QpJFlU4kORKuqY1G4wfrzaZ6m58bQvSq7flBDk4MPhoNR6/vb3nN3Pl80ZhOZ8d52A/jE53HcSXavc3PvAq310O34oXBlrqDfaKTRyQb+RGfIffDzMU7CtX4wDw9yfoYjseTB0lcU3sZk8mkNxqNHmV5/EILdzQcn97FZ4e25Hg0fvj17kF0D8sYrUhyEmqz30/Gk95dbsN0Mu3G2/FxVscwzN6bz+eNOx7Dk1A1Zng/PL3Lrt9ytaqulqvmnwVb2qbAJzkr8nBwjY3cBNvxXV9GCMeO6XTWz+L4hbP82XR25xVnqBbj6reVxTEcjcafLhbL2t1XjdP+81VbFA/ou+krqRJc3V8nkhwIN2DPZ/NOGrYlrnha8fZ8krUxjM/yG9e9+TqBqu04a1VbmPgyS0krervbluKA7TxfsaWvgklwVqRrbORBfFBpp2lPXi6W7cxVbMtlLy3bEq4VrVbrWpbGbxNXmmk5Mbj8PudfnuiV0tiaS3hWpFYkeQi2Rpp25EUCN4UnXGV+FFds1TSN4Xq9ylQ7MixmnKbxC0EbbtsI63KmtWJLMNdcYyPbZrPZH7a3dM/ay9ptt+UstSPX63U9bdcl4qq3kaV25NcnbKTie12tL08OojQ+eLOQ6INGHRjJtvD4Gdv1imf3603qDsr7/T7abL5h9fv0nVx9vLmjWyReZh8MgxilsGRL9LE1SjayLDzDKpXbdUML3t7Ktu53qQyQ/dOlttI/frt07oObq8fipLNiS/LN5RoZF5/Zp/WgnJ1gS+m27g/7sn3w1fbBMFszSuWiwInOioRs2+7SWrFlJ9i2m5QG226fiVbkfn9I5XaGyZBx6BaiNC4KnOysSJNHyLbD/nbXNPweB5UoC+MXbuQ9HIzhq23nPkrvth3WUaI3QwM3rlgs7tK4XVFU3Gdh/MKjYtI6hoWosM3CGEZRtEvxtpWjZB8Rc83ETbKKLAhysi0qFlN58CsWo21WxjCtwVaMitkItkI6v+tCIdqHE5colWsCJxg9+pBkv2JL59lyVEzvWXxmqt6MnBzEVVEqt7NULu2eBm86K7YEE13FRtaDrbhJ5UGlVNpkaAzXtusVtrMUKstCavfB6CiNEwWTnKmpZCPjqtXq7Ch118YLR5VKZZaVMaxUK9O0bVO5XN6E5aCyMH6NRuPtWr22TN3/jUplclWxFe7XNTaTZci4cA2hWqsuUhYUi3Cwy8oYhhCJoihVk13i73SWpf0wDpGUnRwULvfDZxVb+go219jgW9Vq1XmqwrZWm2dp/OKTg7fjV6q2Oa7Ep1kawzhEZun6TmtfnFyFii2FU3TNioRvD7baJErJBIgw9btWr40zV/k26oO0nOpWa7VVu91+K0vj12w2/yIOktSEW3yiMvhinywU7tmsSCUbORDake12a5iGbWm1W6OwPVkbw1ar9e+azUYqqqQ4JJ5kcT9stpqfp6FYiPe/RafbefOLYIvL33fS1qA7JLpBko3chNvwrmciFovFbdiOrI5ho9k4v+t5BnHlOO90slWtPV+1tZrNSRq+x690Ea6qmHS15w5JTve3XCT5UKvV/jo+S73DM+bCUbfXfRIH219ldQzDgbnT6Zzf1eeHdnJcOT7J8n4Yj+FFmIxzh5X36Ott3HROHkn0v6JrbORHfFB+o9ft3smBudvtnIfPz/oYHvePz5p3UXXEJyS9XvezEK6Z7hw06m/HJziP7mKWaWhBNlvNiz87YXh2uE9ZxeY+NnhJvePeWThrveWz9HEcCKd5GcNWu/V5XAHf6n1Z8YnB5/GJwQ9yMX6t1g97vd5nt3mALVcqm3j8/vSi67upbEUmfI1NxUbuhANzfHC5lWtdl62fTvtJnsYvHBxD1RFXH8nfHxhXaqGFe3x8/CBX3YNu583jfu9RWK8x6c+qVqur4+Pe/wvV4ov+PrXP1FGwwcsL19viV1gr7/FwODpNpOsRWmfd7nmoEPM4hldn/h8Wi8X+dDLtJvEZ4ZpaaD/mpVL78yq0+0Y8fh8PB8M3tldPs75pjWZj2m63n3zbTNzSvati3MdGjvV6vQfxgeWP49H4dLPZVG/qfUvl8rrb6TyJK7Uf5Hn8wsEyfoU1Bx9NJtPT3Q0enEM1GFe7j7N+Te0lKvofRlH00XQ6O53PZq2bPClot1uDuNL9zhOr0tNjfepKtiTf3NGPXIvPZn9QLpc/WC6X7bjyOI7PnMvXfa8wnT8Os0FcDY5DVXiPThBer1arHy4Wi850Oj3e767/YM3QNgv3e+W1SnthVdVovB2/jqbT+h9mccDF41i/fi0SHZqtxig+IRi87P2SV8FWuDfX2Kzuz33wrDUZvz5YrVbN8IqDrhEfoIvfeWb8dCWRebVSnYdlk7I8nf8mqrd6rf5RPH6N1XrdWi6W9cNh/53Hp7ji28ZjPwuLLVcqlXX857+8j2MYboKPX0eTyeSTeAxbq9W6uVmvv/NEKxynw2SesP+Fpca+7zqkpXQOxyGzbw5pDLggDrYPNptNbbfblff7fSl+FeNXFBWifXiWWnjGVngkTlztLe9TdfadAdeovx2/Lv8cVx4fxWNYiU8QSldjWDocDlF48nU4IYhfm3DTfDigG7mvdBHeil+Xf44r4I+3223lsD+Ud/td2AdL4Tas8Cy6y30wivfBSnn1KqvZlNJ4sD8k+Nga97Eh5JJzdnaW6zG8WjzZzvRqVVzij+a5mu6fuvvYkntvK48A5FqU0u1K8hqbbx0g98GWvskjGX57AO482Appu8a235sVCcC1PJ3uH0WHNK3JEWYZJVuxaUfmh+8SeEHFFqWtFZngklpRIdr72gFyHmyFQiFVB/t9kmtFRgXBBpD7YLtsRaapZDsqLJfLdxP5haNo52sHULHdftW2/+6lf66jWq3+1AQSgJwHWxSl70B/2B+KSb23diRA7iu29E2oSHYCiWADyHmwpe+m5f1hn2DFFmlFAuQ52KJ0VmyJ3csWucYGkPOKLYXXnJJsRRa0IgFyHmxprNj2yVVshUjFBpDrYItSWLHtE21FWn0EIOcVWyF1Ny1bCBmAawdbvV7/H2lbSjbR6f5mRQLkO9jSWMUk2Yo0eQTgHgTbUcqusyXairTyCED+gy1tq3EkeR9b4UiwAeQ/2FJ23eng0TUAvEqwHaVsWa19gq3IOMQFG0DuK7aU3dt1MHkEgFcJtsI9akWq2ADuRcWWuskjSd6g7SnaAPmv2NJ1H1shwaqqVqu9Y/URgJwHW6VcWaVpw0rFYqJVlZmRAHkPtmpllqYqJt6eRIPWM9kAch5soT3X6bZHadioYjHaNZvNYaK/ePwZvn6AHAdbcHx8/PeNRn1+pxsUFQ7dbncQFmZO8nPKpfLG1w+Q82ALHrz24D/0et3BXTyjrVIpr05OTx51up1/TPqzypXy2tcPkD+lF/2wd9z7h1q99rPNZlPbbraV/X6f2M3SR4XQeixt41BbNBqNf76tX7xarU7j8D7e7w8FuwFAfhQOh/s7h+LJ4yf/dz6bt+wG2dU/6T9ud9o/NhLAM9F9/uWbrebItH8AwZYbofXZ6XRGdgMAwZYb4Xpio9mY2hUABFtunD04+7tmqyncAARbfpyenf5dp9sZHlmRBECw5cVx//jvT077f4pKRauSAAi2fGi1Wv90enryabVeXRgNAMGWC2E5r4cPH/6N1iSAYMuV0Jrsnxw/1poEEGy50W63/+tla7KmNQmQBSVD8N1CazJ+HQ0uBu+Px5Pu0ZH1JQFUbDnwrDVZLGpNAgi2nAityfBonWq1ujQaAIItF+r1+k8evv7w37cv15k0axJAsOVEv3/8n/onx08irUkAwZYX7Xb7x6dakwCCLU++bE22tSYBBFt+9Pt9rUkAwZYvoTV5ctLXmgQQbPnRaDSetibb7bHWJIBgy43+Sf8/ak0CCLZc0ZoEEGy5E1qTx/3jz7QmAZJnEeRbEldsP41fR+Vy+dfD4fBkv98XjQqAii3z2p32j8Nak5VqZWU0AARbLoTWZL/ff9TSmgS4cVqRd+T51uRIaxJAxZYXnWetyYrWJIBgy4nL1uRJ/1Gr1RobDYBXoxWZEl+0JivlfxsNR32tSQAVWy50Op3/ojUJINhyRWsS4Pq0IlNKaxJAxZZLWpMAgi13nq012Wq1JkYD4NtpRWZErVZ7J349a02GG7qdlACo2LLvqjX5qdYkgGDLja+2JgsGBOA5WpEZ9UVrslz+zWh0OWvSSQqAii37Ot3OP4bWZFlrEkCw5cXTx+Acf9bUmgTQisyLZ63JitYkoGIjT65ak4/KlcraaACCjVxoNBr/3O8fP2q2mm7oBu4drcicen7W5Hg01poEVGzkQ7fb1ZoEBBv58lxrcmo0gLzTirwn/rw1eXBSA6jYyL7Qmuyf9D8rl0tak4BgIx+azeZ/D0/objYbWpNA7mhF3lNftiZHvxmPtSYBFRs50e1pTQKCjZx51ppsaE0COaAVyaVnrclRefTb8Xh8rDUJqNjIhW6v+5+1JgHBRq5oTQJZphXJCz3XmnxvPB73tCYBFRu50O11f3TVmtwYDUCwkQtXrclPG8261iSQelqRvJTnW5Oj8fj4sD8UjAqgYiPzQmvy5KT/qJSS1uThSMACgo1XFFqTJ6E12ajP7jzYDoINEGzcgNCaPHtw9re9XveiEBUOd1iyCTZAsHFzvmhNlu6mNVksFd1IDgg2btZla/L09luTxWJx12q1/ptvABBs3LivtCYLt9OarFYrSyMPCDYSddWafHpDd7j6leCrWqvOjTjwdYXD4WAUuHHL5fLd8XhyulgsmslUiNXFa6+99jdGGlCxcStCa/LBg7O/7XY7N96ajAqFfbvdPjfKgIqNOzGbzn45HI5Ot7tt+SbeLw7LQa/X+wcjCwg27sxNtCYLR0eHztNQ+5ERBQQbqTAajt6bTKbd3X5X/D7/LrQfe8e9z9vt9o+NIiDYSF31tpgvetPprL0/7L/1Om8xKu7C/XH1en1cb9R/YvQAwUZqLRbLn2026/p2u61uNtvybrcrxpXZISpGuxBopXJpVavVptVq9adGCxBsANxLpvsDINgAQLABgGADAMEGgGADAMEGAIINAAQbAAg2AAQbAAg2ABBsACDYAECwASDYAECwAYBgAwDBBgCCDQDBBgCCDQAEGwAINgAQbAAINgAQbAAg2ABAsAGAYANAsAGAYAMAwQYAgg0ABBsAgg0ABBsACDYAEGwACDYAEGwAINgAQLABgGADQLABgGADAMEGAIINAAQbAIINAAQbAAg2ABBsACDYABBsACDYAECwAYBgAwDBBoBgAwDBBgCCDQAEGwAINgAEGwBkxP8XYABUTWUX9qgEWQAAAABJRU5ErkJggg==",
    playIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAABQCAYAAABPlrgBAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAF1SURBVHja7NxbbsJADIVhsLzDrHPWVJZSCajUQmguc/Pl91MklAz6dMZv9vX2dSuXRy0X6l7y67nA8Y7yA1NAWa/UOLLxewGF1OxGSYcjJ94JjyMV7xZQEqVGGn0nFI40/l4IHOn03QJKsNTIgDPc4cjAswoojlMjk841jSOTzzeJI0b+RwHFeGrE4JWejmMRZTqOZZRp/cYDyvDUeEEZiuMNZciV8orSNTWeUbrhREBpjhMJpVm/iYhSnZqoKFU40VFO4WRBOdRvsqHsSk1GlE2czCgfcUBZ6TeKxTsMSVkpkvK3FpKyAkJSXjBA+WcWQQCh0e6aVFEw8qGcmmESQHIkpXrCTcGIidJ89lEAiZOUrpOxCobv6zNsblrB8IUybaJewbDfU0zsW1Aw7KGY3MShYNjoKeb3tCgYc1DcbfBRMMb1FNf7nRSMfiihNn8JIG2TEnYvnIJRh5JmY6AAcjwpKfdJKhjbKGwafekpgDzrW4ABAMB/PbhARrnXAAAAAElFTkSuQmCC",
    pauseIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAABQCAYAAABPlrgBAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHjSURBVHja7NxdcoIwEMDxhSD04xD2TpyTO9VDVAsSKIvi6AMVNmCnzn9fnCEJH79kAy9u1LatELcRQwAKKNZI5g7Yfe5G2w5HKZrGSxw7ed1IPtZv+7GVpa5biyuq6ijSbY1ptukeyOeh10xCVRWiA+jj9OuGpuLc/iuQNb4rX7ykThEkSYcF7/vrdm3SteV/kj6H0l9AxkLbtd/CJj3IWJzbCp2wh6L0IJmb1Ff7LQgz+Tw6IZpeD0EpfTQZ5AbGOHOX/cO3s8cnp5RaHyVztg++e6l29wFdZN73nvKVvC8b8ypz0qy7UmpJwlLAOD5NIvM1000sT7lS+KIFBRRQQAEFFFAIUEABBRRQQAEFFFBAAQUUUEAhQAEFFFBAAQUUUEABBRRQQAEFAlBAAQUUUEABBRRQQAEFFFAIUEABBRRQQPk/KInUQWU/rOOr2l47qjo266+U2ttu0DpO4y2LzZPh5RH/YHfGSg4urAKEFouxxNyiNrE1Bb7KeTeo/UNTz1g9J199TxniPXOTYbSf9l9oH8zXBAl+++iD1t38lyMbmR7X9gVBLg+rtZ7GYl82ZpBTJgSGpkRyLsVxXQZEj2f98XqV1+b1PjGUGBoqd3WbctC5I8ok8vEGCiigrBs/AgwAO8iO8aKxXSIAAAAASUVORK5CYII=",
    muteIconStyle: "display: block; height: 25px; width: 25px; position: absolute; left: 30px; top: 30px;",
    playPauseIconStyle: "display: block; height: 25px; width: 25px; position: absolute; left: 75px; top: 30px;",
    muteButtonClass: 'audio-toggle',
    pauseButtonClass: 'play-pause-toggle'
};

aslider.init();
