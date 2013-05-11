/**
 * The Shadowbox object.
 *
 * @type    {Object}
 * @public
 */
var S = {

    /**
     * The current version of Shadowbox.
     *
     * @type    {String}
     * @public
     */
    version: "3.0.4"

}

Array.prototype.contains = Array.prototype.contains || function (obj) {
    for (var i = 0; i < this.length; ++i) {
        if (this[i] === obj) {
            return true;
        }
    }

    return false;
}

var galleryName = /^(light|shadow)box\[(.*?)\]/i,
    inlineParam = /\s*([a-z_]*?)\s*=\s*(.+)\s*/,
    fileExtension = /[0-9a-z]+$/i,
    scriptPath = /(.+\/)shadowbox\.js/i,

root = document.documentElement,

/**
 * True if Shadowbox is currently open, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
open = false,

/**
 * True if Shadowbox has been initialized, false otherwise.
 *
 * @type    {Boolean}
 * @private
 */
initialized = false,

/**
 * The previous set of options that were used before Shadowbox.applyOptions
 * was called.
 *
 * @type    {Object}
 * @private
 */
lastOptions = {},

/**
 * The delay in milliseconds that the current gallery uses.
 *
 * @type    {Number}
 * @private
 */
slideDelay = 0,

/**
 * The time at which the current slideshow frame appeared.
 *
 * @type    {Number}
 * @private
 */
slideStart,

/**
 * The timeout id for the slideshow transition function.
 *
 * @type    {Number}
 * @private
 */
slideTimer,

/**
 * True if this browser supports opacity.
 *
 * @type    {Boolean}
 * @private
 */
supportsOpacity = "opacity" in root.style && typeof root.style.opacity === "string",

/**
 * True if the browser supports fixed positioning.
 *
 * @type    {Boolean}
 * @private
 */
supportsFixed = false;

(function () {
    var div = document.createElement("div");
    div.style.position = "fixed";
    div.style.margin = 0;
    div.style.top = "20px";
    root.appendChild(div, root.firstChild);
    supportsFixed = div.offsetTop == 20;
    root.removeChild(div);
})();

/**
 * The index of the current object in the gallery array.
 *
 * @type    {Number}
 * @public
 */
S.current = -1;

/**
 * The current dimensions of Shadowbox.
 *
 * @type    {Object}
 * @public
 */
S.dimensions = null;

/**
 * Easing function used for animations. Based on a cubic polynomial.
 *
 * @param   {Number}    state   The state of the animation (% complete)
 * @return  {Number}            The adjusted easing value
 * @public
 */
S.ease = function(state) {
    return 1 + Math.pow(state - 1, 3);
}

/**
 * An object containing names of plugins and links to their respective download pages.
 *
 * @type    {Object}
 * @public
 */
S.errorInfo = {
    fla: {
        name: "Flash",
        url:  "http://www.adobe.com/products/flashplayer/"
    },
    qt: {
        name: "QuickTime",
        url:  "http://www.apple.com/quicktime/download/"
    }
};

/**
 * The content objects in the current set.
 *
 * @type    {Array}
 * @public
 */
S.gallery = [];

/**
 * A function that will be called as soon as the DOM is ready.
 *
 * @type    {Function}
 * @public
 */
S.onReady = noop;

/**
 * The URL path to the Shadowbox script.
 *
 * @type    {String}
 * @public
 */
S.path = null;

/**
 * The current player object.
 *
 * @type    {Object}
 * @public
 */
S.player = null;

/**
 * The id to use for the Shadowbox player element.
 *
 * @type    {String}
 * @public
 */
S.playerId = "sb-player";

/**
 * Various options that control Shadowbox' behavior.
 *
 * @type    {Object}
 * @public
 */
S.options = {

    /**
     * True to enable animations.
     *
     * @type    {Boolean}
     */
    animate: true,

    /**
     * True to enable opacity animations.
     *
     * @type    {Boolean}
     */
    animateFade: true,

    /**
     * True to automatically play movies when the load.
     *
     * @type    {Boolean}
     */
    autoplayMovies: true,

    /**
     * True to enable the user to skip to the first item in a gallery from the last using
     * next.
     *
     * @type    {Boolean}
     */
    continuous: false,

    /**
     * True to enable keyboard navigation.
     *
     * @type    {Boolean}
     */
    enableKeys: true,

    /**
     * Parameters to pass to flash <object>'s.
     *
     * @type    {Object}
     */
    flashParams: {
        bgcolor: "#000000",
        allowfullscreen: true
    },

    /**
     * Variables to pass to flash <object>'s.
     *
     * @type    {Object}
     */
    flashVars: {},

    /**
     * The minimum required Flash version.
     *
     * Note: The default is 9.0.115. This is the minimum version suggested by
     * the JW FLV player.
     *
     * @type    {String}
     */
    flashVersion: "9.0.115",

    /**
     * Determines how oversized content is handled. If set to "resize" the
     * content will be resized while preserving aspect ratio. If "drag" will display
     * the image at its original resolution but it will be draggable. If "none" will
     * display the content at its original resolution but it may be cropped.
     *
     * @type    {String}
     */
    handleOversize: "resize",

    /**
     * Determines how unsupported content is handled. If set to "remove" will
     * remove the content from the gallery. If "link" will display a helpful
     * link to a page where the necessary browser plugin can be installed.
     *
     * @type    {String}
     */
    handleUnsupported: "link",

    /**
     * A hook function to be fired when changing from one gallery item to the
     * next. Is passed the item that is about to be displayed as its only argument.
     *
     * @type    {Function}
     */
    onChange: noop,

    /**
     * A hook function to be fired when closing. Is passed the most recent item
     * as its only argument.
     *
     * @type    {Function}
     */
    onClose: noop,

    /**
     * A hook funciton to be fires when content is finished loading. Is passed the
     * current gallery item as its only argument.
     *
     * @type    {Function}
     */
    onFinish: noop,

    /**
     * A hook function to be fired when opening. Is passed the current gallery item
     * as its only argument.
     *
     * @type    {Function}
     */
    onOpen: noop,

    /**
     * True to enable movie controls on movie players.
     *
     * @type    {Boolean}
     */
    showMovieControls: true,

    /**
     * True to skip calling setup during init.
     *
     * @type    {Boolean}
     */
    skipSetup: false,

    /**
     * The delay (in seconds) to use when displaying a gallery in slideshow mode. Setting
     * this option to any value other than 0 will trigger slideshow mode.
     *
     * @type    {Number}
     */
    slideshowDelay: 0,

    /**
     * The ammount of padding (in pixels) to maintain around the edge of the viewport at all
     * times.
     *
     * @type    {Number}
     */
    viewportPadding: 20

};

/**
 * Gets the object that is currently being displayed.
 *
 * @return  {Object}
 * @public
 */
S.getCurrent = function() {
    return S.current > -1 ? S.gallery[S.current] : null;
}

/**
 * Returns true if there is another object to display after the current.
 *
 * @return  {Boolean}
 * @public
 */
S.hasNext = function() {
    return S.gallery.length > 1 && (S.current != S.gallery.length - 1 || S.options.continuous);
}

/**
 * Returns true if Shadowbox is currently open.
 *
 * @return  {Boolean}
 * @public
 */
S.isOpen = function() {
    return open;
}

/**
 * Returns true if Shadowbox is currently paused.
 *
 * @return  {Boolean}
 * @public
 */
S.isPaused = function() {
    return slideTimer == "pause";
}

/**
 * Applies the given set of options to Shadowbox' options. May be undone with revertOptions().
 *
 * @param   {Object}    options
 * @public
 */
S.applyOptions = function(options) {
    lastOptions = apply({}, S.options);
    apply(S.options, options);
}

/**
 * Reverts to whatever the options were before applyOptions() was called.
 *
 * @public
 */
S.revertOptions = function() {
    apply(S.options, lastOptions);
}

/**
 * Initializes the Shadowbox environment. If options are given here, they
 * will override the defaults. A callback may be provided that will be called
 * when the document is ready. This function can be used for setting up links
 * using Shadowbox.setup.
 *
 * @param   {Object}    options
 * @param   {Function}  callback
 * @public
 */
S.init = function(options, callback) {
    if (initialized)
        return;

    initialized = true;

    if (S.skin.options)
        apply(S.options, S.skin.options);

    if (options)
        apply(S.options, options);

    if (!S.path) {
        // determine script path automatically
        var path, scripts = document.getElementsByTagName("script");
        for (var i = 0, len = scripts.length; i < len; ++i) {
            path = scriptPath.exec(scripts[i].src);
            if (path) {
                S.path = path[1];
                break;
            }
        }
    }

    if (callback)
        S.onReady = callback;

    bindLoad();
}

/**
 * Opens the given object in Shadowbox. This object may be any of the following:
 *
 * - A URL specifying the location of some content to display
 * - An HTML link object (A or AREA tag) that links to some content
 * - A custom object similar to one produced by Shadowbox.makeObject
 * - An array of any of the above
 *
 * Note: When a single link object is given, Shadowbox will automatically search
 * for other cached link objects that have been set up in the same gallery and
 * display them all together.
 *
 * @param   {mixed}     obj
 * @public
 */
S.open = function(obj) {
    if (open)
        return;

    var gc = S.makeGallery(obj);
    S.gallery = gc[0];
    S.current = gc[1];

    obj = S.getCurrent();

    if (obj == null)
        return;

    S.applyOptions(obj.options || {});

    filterGallery();

    // anything left to display?
    if (S.gallery.length) {
        obj = S.getCurrent();

        if (S.options.onOpen(obj) === false)
            return;

        open = true;

        S.skin.onOpen(obj, load);
    }
}

/**
 * Closes Shadowbox.
 *
 * @public
 */
S.close = function() {
    if (!open)
        return;

    open = false;

    if (S.player) {
        S.player.remove();
        S.player = null;
    }

    if (typeof slideTimer == "number") {
        clearTimeout(slideTimer);
        slideTimer = null;
    }
    slideDelay = 0;

    listenKeys(false);

    S.options.onClose(S.getCurrent());

    S.skin.onClose();

    S.revertOptions();
}

/**
 * Starts a slideshow when a gallery is being displayed. Is called automatically
 * when the slideshowDelay option is set to anything other than 0.
 *
 * @public
 */
S.play = function() {
    if (!S.hasNext())
        return;

    if (!slideDelay)
        slideDelay = S.options.slideshowDelay * 1000;

    if (slideDelay) {
        slideStart = now();
        slideTimer = setTimeout(function(){
            slideDelay = slideStart = 0; // reset slideshow
            S.next();
        }, slideDelay);

        if(S.skin.onPlay)
            S.skin.onPlay();
    }
}

/**
 * Pauses a slideshow on the current object.
 *
 * @public
 */
S.pause = function() {
    if (typeof slideTimer != "number")
        return;

    slideDelay = Math.max(0, slideDelay - (now() - slideStart));

    // if there's any time left on current slide, pause the timer
    if (slideDelay) {
        clearTimeout(slideTimer);
        slideTimer = "pause";

        if(S.skin.onPause)
            S.skin.onPause();
    }
}

/**
 * Changes Shadowbox to display the item in the gallery specified by index.
 *
 * @param   {Number}    index
 * @public
 */
S.change = function(index) {
    if (!(index in S.gallery)) {
        if (S.options.continuous) {
            index = (index < 0 ? S.gallery.length + index : 0); // loop
            if (!(index in S.gallery))
                return;
        } else {
            return;
        }
    }

    S.current = index;

    if (typeof slideTimer == "number") {
        clearTimeout(slideTimer);
        slideTimer = null;
        slideDelay = slideStart = 0;
    }

    S.options.onChange(S.getCurrent());

    load(true);
}

/**
 * Advances to the next item in the gallery.
 *
 * @public
 */
S.next = function() {
    S.change(S.current + 1);
}

/**
 * Rewinds to the previous gallery item.
 *
 * @public
 */
S.previous = function() {
    S.change(S.current - 1);
}

/**
 * Calculates the dimensions for Shadowbox.
 *
 * @param   {Number}    height          The height of the object
 * @param   {Number}    width           The width of the object
 * @param   {Number}    maxHeight       The maximum available height
 * @param   {Number}    maxWidth        The maximum available width
 * @param   {Number}    topBottom       The extra top/bottom required for borders/toolbars
 * @param   {Number}    leftRight       The extra left/right required for borders/toolbars
 * @param   {Number}    padding         The amount of padding (in pixels) to maintain around
 *                                      the edge of the viewport
 * @param   {Boolean}   preserveAspect  True to preserve the original aspect ratio when the
 *                                      given dimensions are too large
 * @return  {Object}                    The new dimensions object
 * @public
 */
S.setDimensions = function(height, width, maxHeight, maxWidth, topBottom, leftRight, padding, preserveAspect) {
    var originalHeight = height,
        originalWidth = width;

    // constrain height/width to max
    var extraHeight = 2 * padding + topBottom;
    if (height + extraHeight > maxHeight)
        height = maxHeight - extraHeight;
    var extraWidth = 2 * padding + leftRight;
    if (width + extraWidth > maxWidth)
        width = maxWidth - extraWidth;

    // determine if object is oversized
    var changeHeight = (originalHeight - height) / originalHeight,
        changeWidth = (originalWidth - width) / originalWidth,
        oversized = (changeHeight > 0 || changeWidth > 0);

    // adjust height/width if too large
    if (preserveAspect && oversized) {
        // preserve aspect ratio according to greatest change
        if (changeHeight > changeWidth) {
            width = Math.round((originalWidth / originalHeight) * height);
        } else if (changeWidth > changeHeight) {
            height = Math.round((originalHeight / originalWidth) * width);
        }
    }

    S.dimensions = {
        height:         height + topBottom,
        width:          width + leftRight,
        innerHeight:    height,
        innerWidth:     width,
        top:            Math.floor((maxHeight - (height + extraHeight)) / 2 + padding),
        left:           Math.floor((maxWidth - (width + extraWidth)) / 2 + padding),
        oversized:      oversized
    };

    return S.dimensions;
}

/**
 * Returns an array with two elements. The first is an array of objects that
 * constitutes the gallery, and the second is the index of the given object in
 * that array.
 *
 * @param   {mixed}     obj
 * @return  {Array}     An array containing the gallery and current index
 * @public
 */
S.makeGallery = function(obj) {
    var gallery = [], current = -1;

    if (typeof obj == "string")
        obj = [obj];

    if (typeof obj.length == "number") {
        each(obj, function(i, o) {
            if (o.content) {
                gallery[i] = o;
            } else {
                gallery[i] = {content: o};
            }
        });
        current = 0;
    } else {
        if (obj.tagName) {
            // check the cache for this object before building one on the fly
            var cacheObj = S.getCache(obj);
            obj = cacheObj ? cacheObj : S.makeObject(obj);
        }

        if (obj.gallery) {
            // gallery object, build gallery from cached gallery objects
            gallery = [];

            var o;
            for (var key in S.cache) {
                o = S.cache[key];
                if (o.gallery && o.gallery == obj.gallery) {
                    if (current == -1 && o.content == obj.content)
                        current = gallery.length;
                    gallery.push(o);
                }
            }

            if (current == -1) {
                gallery.unshift(obj);
                current = 0;
            }
        } else {
            // single object, no gallery
            gallery = [obj];
            current = 0;
        }
    }

    // use apply to break references to each gallery object here because
    // the code may modify certain properties of these objects from here
    // on out and we want to preserve the original in case the same object
    // is used again in a future call
    each(gallery, function(i, o) {
        gallery[i] = apply({}, o);
    });

    return [gallery, current];
}

/**
 * Extracts parameters from a link element and returns an object containing
 * (most of) the following keys:
 *
 * - content:  The URL of the linked to content
 * - player:   The abbreviated name of the player to use for the object (can automatically
 *             be determined in most cases)
 * - title:    The title to use for the object (optional)
 * - gallery:  The name of the gallery the object belongs to (optional)
 * - height:   The height of the object (in pixels, only required for movies and Flash)
 * - width:    The width of the object (in pixels, only required for movies and Flash)
 * - options:  A set of options to use for this object (optional)
 * - link:     A reference to the original link element
 *
 * A custom set of options may be passed in here that will be applied when
 * this object is displayed. However, any options that are specified in
 * the link's HTML markup will trump options given here.
 *
 * @param   {HTMLElement}   link
 * @param   {Object}        options
 * @return  {Object}        An object representing the link
 * @public
 */
S.makeObject = function(link, options) {
    var obj = {
        // accessing the href attribute directly here (instead of using
        // getAttribute) should give a full URL instead of a relative one
        content:    link.href,
        title:      link.getAttribute("title") || "",
        link:       link
    };

    // remove link-level options from top-level options
    if (options) {
        options = apply({}, options);
        each(["player", "title", "height", "width", "gallery"], function(i, o) {
            if (typeof options[o] != "undefined") {
                obj[o] = options[o];
                delete options[o];
            }
        });
        obj.options = options;
    } else {
        obj.options = {};
    }

    if (!obj.player)
        obj.player = S.getPlayer(obj.content);

    // HTML options always trump JavaScript options, so do these last
    var rel = link.getAttribute("data-rel");
    if (rel) {
        // extract gallery name from shadowbox[name] format
        var match = rel.match(galleryName);
        if (match)
            obj.gallery = escape(match[2]);

        // extract any other parameters
        each(rel.split(';'), function(i, p) {
            match = p.match(inlineParam);
            if (match)
                obj[match[1]] = match[2];
        });
    }

    return obj;
}

/**
 * Attempts to automatically determine the correct player to use for an object based
 * on its content attribute. Defaults to "iframe" when the content type cannot
 * automatically be determined.
 *
 * @param   {String}    content     The content attribute of the object
 * @return  {String}                The name of the player to use
 * @public
 */
S.getPlayer = function(content) {
    // strip query string for player detection purposes
    var q = content.indexOf("?");
    if (q > -1) {
        content = content.substring(0, q);
    }

    // get file extension
    var ext, m = content.match(fileExtension);
    if (m) {
        ext = m[0].toLowerCase();
    }

    if (ext) {
        if (S.img && S.img.ext.contains(ext)) {
            return "img";
        }
        if (S.swf && S.swf.ext.contains(ext)) {
            return "swf";
        }
        if (S.flv && S.flv.ext.contains(ext)) {
            return "flv";
        }
        if (S.qt && S.qt.ext.contains(ext)) {
            return "qt";
        }
    }

    return "iframe";
}

/**
 * Filters the current gallery for unsupported objects.
 *
 * @private
 */
function filterGallery() {
    var err = S.errorInfo, plugins = S.plugins, obj, remove, needed,
        m, flashVersion;

    for (var i = 0; i < S.gallery.length; ++i) {
        obj = S.gallery[i]

        remove = false; // remove the object?
        needed = null; // what plugins are needed?

        switch (obj.player) {
        case "flv":
        case "swf":
            if (!plugins.fla) {
                needed = "fla";
            }
            break;
        case "qt":
            if (!plugins.qt) {
                needed = "qt";
            }
            break;
        }

        // handle unsupported elements
        if (needed) {
            if (S.options.handleUnsupported == "link") {
                // generate a link to the appropriate plugin download page
                obj.player = "html";
                obj.content = '<div class="sb-message">Please download <a href="' + err[needed].url + '">' + err[needed].name + '</a> in order to view this content.</div>';
            } else {
                remove = true;
            }
        } else if (obj.player == "swf" || obj.player == "flv") {
            flashVersion = (obj.options && obj.options.flashVersion) || S.options.flashVersion;

            if (S.flash && !S.flash.hasFlashPlayerVersion(flashVersion)) {
                // express install will be triggered because the client does not meet the
                // minimum required version of Flash. set height and width to those of expressInstall.swf
                obj.width = 310;
                // minimum height is 127, but +20 pixels on top and bottom looks better
                obj.height = 177;
            }
        }

        if (remove) {
            S.gallery.splice(i, 1);

            if (i < S.current) {
                --S.current; // maintain integrity of S.current
            } else if (i == S.current) {
                S.current = i > 0 ? i - 1 : i; // look for supported neighbor
            }

            // decrement index for next loop
            --i;
        }
    }
}

/**
 * Sets up a listener on the document for keydown events.
 *
 * @param   {Boolean}   on      True to enable the listener, false to disable
 * @private
 */
function listenKeys(on) {
    if (!S.options.enableKeys)
        return;

    (on ? addEvent : removeEvent)(document, "keydown", handleKey);
}

/**
 * A listener function that is fired when a key is pressed.
 *
 * @param   {Event}     e   The keydown event
 * @private
 */
function handleKey(e) {
    // don't handle events with modifier keys
    if (e.metaKey || e.shiftKey || e.altKey || e.ctrlKey) {
        return;
    }

    var handler;

    switch (e.keyCode) {
    case 81: // q
    case 88: // x
    case 27: // esc
        handler = S.close;
        break;
    case 37: // left
        handler = S.previous;
        break;
    case 39: // right
        handler = S.next;
        break;
    case 32: // space
        handler = typeof slideTimer == "number" ? S.pause : S.play;
        break;
    }

    if (handler) {
        e.preventDefault();
        handler();
    }
}

/**
 * Loads the current object.
 *
 * @param   {Boolean}   True if changing from a previous object
 * @private
 */
function load(changing) {
    listenKeys(false);

    var obj = S.getCurrent(),
        player = obj.player;

    if (typeof S[player] !== "function") {
        throw "unknown player " + player;
    }

    if (changing) {
        S.player.remove();
        S.revertOptions();
        S.applyOptions(obj.options || {});
    }

    S.player = new S[player](obj, S.playerId);

    // preload neighboring gallery images
    if (S.gallery.length > 1) {
        var next = S.gallery[S.current + 1] || S.gallery[0];
        if (next.player === "img") {
            var a = new Image();
            a.src = next.content;
        }
        var prev = S.gallery[S.current - 1] || S.gallery[S.gallery.length - 1];
        if (prev.player === "img") {
            var b = new Image();
            b.src = prev.content;
        }
    }

    S.skin.onLoad(changing, waitReady);
}

/**
 * Waits until the current object is ready to be displayed.
 *
 * @private
 */
function waitReady() {
    if (!open)
        return;

    if (typeof S.player.ready != "undefined") {
        // wait for content to be ready before loading
        var timer = setInterval(function() {
            if (open) {
                if (S.player.ready) {
                    clearInterval(timer);
                    timer = null;
                    S.skin.onReady(show);
                }
            } else {
                clearInterval(timer);
                timer = null;
            }
        }, 10);
    } else {
        S.skin.onReady(show);
    }
}

/**
 * Displays the current object.
 *
 * @private
 */
function show() {
    if (!open)
        return;

    S.player.append(S.skin.body, S.dimensions);

    S.skin.onShow(finish);
}

/**
 * Finishes up any remaining tasks after the object is displayed.
 *
 * @private
 */
function finish() {
    if (!open)
        return;

    if (S.player.onLoad)
        S.player.onLoad();

    S.options.onFinish(S.getCurrent());

    if (!S.isPaused())
        S.play(); // kick off next slide

    listenKeys(true);
}

/**
 * Gets the current time in milliseconds.
 *
 * @return  {Number}
 * @private
 */
function now() {
    return (new Date).getTime();
}

/**
 * Applies all properties of extension to original.
 *
 * @param   {Object}    original
 * @param   {Object}    extension
 * @return  {Object}    The original object
 * @private
 */
function apply(original, extension) {
    for (var property in extension)
        original[property] = extension[property];
    return original;
}

/**
 * Calls the given callback function for each element in obj. Note: obj must be an array-like
 * object.
 *
 * @param   {Array|mixed}   obj
 * @param   {Function}      callback
 * @private
 */
function each(obj, callback) {
    var i = 0, len = obj.length;
    for (var value = obj[0]; i < len && callback.call(value, i, value) !== false; value = obj[++i]) {}
}

/**
 * A no-op function.
 *
 * @private
 */
function noop() {}

/**
 * Gets the element with the given id.
 *
 * @param   {String}        id
 * @return  {HTMLElement}
 * @private
 */
function get(id) {
    return document.getElementById(id);
}

/**
 * Removes an element from the DOM.
 *
 * @param   {HTMLElement}   el          The element to remove
 * @private
 */
function remove(el) {
    el.parentNode.removeChild(el);
}

/**
 * Gets the computed value of the style on the given element.
 *
 * Note: This function is not safe for retrieving float values or non-pixel values
 * in IE.
 *
 * @param   {HTMLElement}   el          The element
 * @param   {String}        style       The camel-cased name of the style
 * @return  {mixed}                     The computed value of the given style
 * @public
 */
S.getStyle = (function() {
    var opacity = /opacity=([^)]*)/,
        getComputedStyle = document.defaultView && document.defaultView.getComputedStyle;

    return function(el, style) {
        var ret;

        if (!supportsOpacity && style == "opacity" && el.currentStyle) {
            ret = opacity.test(el.currentStyle.filter || "") ? (parseFloat(RegExp.$1) / 100) + "" : "";
            return ret === "" ? "1" : ret;
        }

        if (getComputedStyle) {
            var computedStyle = getComputedStyle(el, null);

            if (computedStyle)
                ret = computedStyle[style];

            if (style == "opacity" && ret == "")
                ret = "1";
        } else {
            ret = el.currentStyle[style];
        }

        return ret;
    }
})();

/**
 * Appends an HTML fragment to the given element.
 *
 * @param   {HTMLElement}   el
 * @param   {String}        html    The HTML fragment to use
 * @public
 */
S.appendHTML = function(el, html) {
    if (el.insertAdjacentHTML) {
        el.insertAdjacentHTML("BeforeEnd", html);
    } else if (el.lastChild) {
        var range = el.ownerDocument.createRange();
        range.setStartAfter(el.lastChild);
        var frag = range.createContextualFragment(html);
        el.appendChild(frag);
    } else {
        el.innerHTML = html;
    }
}

/**
 * Gets the window size. The dimension may be either "Height" or "Width".
 *
 * @param   {String}    dimension
 * @return  {Number}
 * @public
 */
S.getWindowSize = function(dimension) {
    if (document.compatMode === "CSS1Compat")
        return document.documentElement["client" + dimension];

    return document.body["client" + dimension];
}

/**
 * Sets an element's opacity.
 *
 * @param   {HTMLElement}   el
 * @param   {Number}        opacity
 * @public
 */
S.setOpacity = function(el, opacity) {
    var style = el.style;
    if (supportsOpacity) {
        style.opacity = (opacity == 1 ? "" : opacity);
    } else {
        style.zoom = 1; // trigger hasLayout
        if (opacity == 1) {
            if (typeof style.filter == "string" && (/alpha/i).test(style.filter))
                style.filter = style.filter.replace(/\s*[\w\.]*alpha\([^\)]*\);?/gi, "");
        } else {
            style.filter = (style.filter || "").replace(/\s*[\w\.]*alpha\([^\)]*\)/gi, "") +
                " alpha(opacity=" + (opacity * 100) + ")";
        }
    }
}

/**
 * Clears the opacity setting on the given element. Needed for some cases in IE.
 *
 * @param   {HTMLElement}   el
 * @public
 */
S.clearOpacity = function(el) {
    S.setOpacity(el, 1);
}

/**
 * Gets the target of the given event. The event object passed will be
 * the same object that is passed to listeners registered with
 * addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {HTMLElement}       The event's target element
 * @private
 */
function getTarget(e) {
    var target = e.target ? e.target : e.srcElement;
    return target.nodeType == 3 ? target.parentNode : target;
}

/**
 * Gets the page X/Y coordinates of the mouse event in an [x, y] array.
 * The page coordinates should be relative to the document, and not the
 * viewport. The event object provided here will be the same object that
 * is passed to listeners registered with addEvent().
 *
 * @param   {Event}     e       The event object
 * @return  {Array}             The page X/Y coordinates
 * @private
 */
function getPageXY(e) {
    var x = e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft)),
        y = e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
    return [x, y];
}

// Event handling functions below modified from original by Dean Edwards
// http://dean.edwards.name/my/events.js

/**
 * Adds an event handler to the given element. The handler should be called
 * in the scope of the element with the event object as its only argument.
 *
 * @param   {HTMLElement}   el          The element to listen to
 * @param   {String}        type        The type of the event to add
 * @param   {Function}      handler     The event handler function
 * @private
 */
function addEvent(el, type, handler) {
    if (el.addEventListener) {
        el.addEventListener(type, handler, false);
    } else {
        if (el.nodeType === 3 || el.nodeType === 8)
            return;

        if (el.setInterval && (el !== window && !el.frameElement))
            el = window;

        if (!handler.__guid)
            handler.__guid = addEvent.guid++;

        if (!el.events)
            el.events = {};

        var handlers = el.events[type];
        if (!handlers) {
            handlers = el.events[type] = {};

            if (el["on" + type])
                handlers[0] = el["on" + type];
        }

        handlers[handler.__guid] = handler;

        el["on" + type] = addEvent.handleEvent;
    }
}

addEvent.guid = 1;

addEvent.handleEvent = function(event) {
    var result = true;
    event = event || addEvent.fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
    var handlers = this.events[event.type];

    for (var i in handlers) {
        this.__handleEvent = handlers[i];
        if (this.__handleEvent(event) === false) {
            result = false;
        }
    }

    return result;
}

addEvent.preventDefault = function() {
    this.returnValue = false;
}

addEvent.stopPropagation = function() {
    this.cancelBubble = true;
}

addEvent.fixEvent = function(e) {
    e.preventDefault = addEvent.preventDefault;
    e.stopPropagation = addEvent.stopPropagation;
    e.keyCode = e.which;
    return e;
}

/**
 * Removes an event handler from the given element.
 *
 * @param   {HTMLElement}   el          The DOM element to stop listening to
 * @param   {String}        type        The type of the event to remove
 * @param   {Function}      handler     The event handler function
 * @private
 */
function removeEvent(el, type, handler) {
    if (el.removeEventListener) {
        el.removeEventListener(type, handler, false);
    } else {
        if (el.events && el.events[type])
            delete el.events[type][handler.__guid];
    }
}
