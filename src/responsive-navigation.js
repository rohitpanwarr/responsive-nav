(function(factory) {
  /* global define */
  /* istanbul ignore next */
  if ( typeof define === 'function' && define.amd ) {
    define(['jquery'], factory);
  } else if ( typeof module === 'object' && module.exports ) {
    // Node/CommonJS
    module.exports = function( root, jQuery ) {
      if ( jQuery === undefined ) {
        if ( typeof window !== 'undefined' ) {
          jQuery = require('jquery');
        } else {
          jQuery = require('jquery')(root);
        }
      }
      factory(jQuery);
      return jQuery;
    };
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function($) {
  'use strict';

  var $doc = $(document);
  var $win = $(window);
  var pluginName = 'responsiveNav';
  var eventNamespaceSuffix = '.resNav';
  var classList = 'Open Button Label Items Selected Highlighted';

  /**
   * Create an instance of Responsive Nav
   *
   * @constructor
   * @param {Node} element - The &lt;nav&gt; element
   * @param {object}  opts - Options
   */
  var responsiveNav = function(element, opts) {
    var _this = this;

    _this.elements = element;
    _this.$element = $(element);

    _this.state = {
      opened         : false,
      selectedIdx    : -1,
      highlightedIdx : -1,
      dropDownInitialised: 0,
    };

     _this.init(opts);
  };

  responsiveNav.prototype = {

    utils: {
      /**
       * Transform camelCase string to dash-case.
       *
       * @param  {string} str - The camelCased string.
       * @return {string}       The string transformed to dash-case.
       */
      addDash: function(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      },

      /**
       * Calls the events registered with function name.
       *
       * @param {string}    fn - The name of the function.
       * @param {number} scope - Scope that should be set on the function.
       */
      triggerCustomEvent: function(fn, scope) {
        var elm = scope.element,
          func = scope.options['on' + fn],
          args = [elm].concat([].slice.call(arguments).slice(1));

        if ( $.isFunction(func) ) {
          func.apply(elm, args);
        }

        $(elm).trigger(pluginName + '-' + this.addDash(fn), args);
      }
    },

    /**
     * Generate classNames for elements
     *
     * @return {object} Classes object
     */
    getClassNames: function() {
      var _this = this,
        customClass = _this.options.customClass,
        classesObj = {};

      $.each(classList.split(' '), function(i, currClass) {
        var c = currClass.toLowerCase();
        classesObj[currClass.toLowerCase()] = c;
      });

      classesObj.prefix = customClass.prefix;

      return classesObj;
    },
    
    /**
     * Initialise the sum of width of all list items used for comparing to container width 
     * 
     * @return {void}
     */
    setListItemWidth: function() {
      var listWidth = 0;

      this.parentListItems.forEach(function(elem) {
        listWidth += $(elem).outerWidth();  
      });

      return listWidth;
    },
    /**
     * Paints the drop down dom using the child and parent list. 
     * The container is emptied and contents refilled on each invocation.
     * 
     * @return {void}
     */
    paintDropDown: function() {
      var _this = this;
      _this.elements.srcElement.empty().append($(_this.parentListItems),_this.elements.childListWrap);

      if(_this.childListItems.length > 0) {
        _this.elements.list.append($(_this.childListItems));
       _this.state.selectedIdx = $('.m-navigation-control').find('.'+this.classes.selected).index() || -1;
       // list items
        _this.$li = _this.elements.list.find('li');
      } else {
        _this.resetState();
        _this.updateAttributes();
      }
      /* Rebind button and other events. */
      _this.bindEvents();
    },

    /**
     * Plugin initialisation method. Initialises plugin specific variables.
     * Binds elemet events and calls first invocation render methods.
     * 
     * @param  {Object} opts Option overrides passed during initialisation call
     * @return {void}
     */
    init: function(opts) {
      var _this = this,
        outerWrapper,
        itemsWrapper,
        list,
        button,
        icon,
        label,
        childList,
        childListWrap;

      // Set options
      _this.options = $.extend(true, {}, $.fn[pluginName].defaults, _this.options, opts);

      _this.utils.triggerCustomEvent('BeforeInit', _this);

      // adding dropdown theme to classlist.
      classList = classList + ' ' + _this.options.theme;

      // Get classes
      _this.classes = _this.getClassNames();

      /* Create static dom to be added on initialise*/
      outerWrapper = $('<div/>', { 'class': _this.classes[_this.options.theme], 'tabindex': -1 , 'role': 'navigation' , 'aria-expanded': 'false' }),
      itemsWrapper = $('<div/>',   { 'class': _this.classes.items, 'tabindex': -1 }),
      childList = $('<ul/>', { 'class': 'm-navigation-grey-dropdown drop-down-close' }),
      label = $('<span/>',  { 'class': _this.classes.label}),
      button = $('<div/>',   { 'class': _this.classes.button, 'tabindex': 0 }),
      childListWrap = $('<li/>', { 'class': 'm-navigation-control m-navigation-open' }),
      icon = $('<b/>', {'class': 't-icon-arrow-down'});

      /* Add plugin scope reference to dom objects */
      _this.elements = {
        srcElement      : _this.$element.children('ul'),
        list            : childList,
        label           : label,
        button          : button.append(icon),
        icon            : icon,
        childListWrap   : childListWrap,
        itemsWrapper    : itemsWrapper.append(childList),
        outerWrapper    : outerWrapper.append(button,label),
      };

      /* Initialise width values and array constructs to be used for processing */
      _this.srcElementWidth = _this.elements.srcElement.outerWidth();

      _this.parentListItems = _this.elements.srcElement.find('li').toArray();

      _this.listItemsWidth = _this.setListItemWidth();

      _this.childListItems = [];

       _this.elements.srcElement.append(
        _this.elements.childListWrap.append(
          _this.elements.outerWrapper));

       _this.$element.append(itemsWrapper);

      _this.options.buttonWidth = _this.elements.childListWrap.outerWidth() + 10;
      _this.elements.childListWrap.removeClass('m-navigation-open').addClass('m-navigation-close');

      /* Set total items height for auto scroll purpose. */
      _this.itemsHeight = _this.elements.srcElement.find('li:first-child').outerHeight();

      /* Create structure dom for the drop down in the container */  

      _this.render();
      _this.bindEvents();

    },

    /**
     * Creates array of items to be shown in nav and in drop donw based on current screen width
     * @return {void} 
     */
    render: function(prodType) {
      var _this = this,
        listWrapper = _this.elements.srcElement,
        prevSrcWidth = _this.srcElementWidth,
        newSrcWidth = listWrapper.outerWidth(),
        lastItem, firstItem;
      if(_this.options.breakPoint){
        if($win.outerWidth() <= _this.options.breakPoint){
          while(_this.parentListItems.length > 0){
            _this.paintDropDown();
            _this.state.dropDownInitialised = 1;
            _this.updateAttributes(); 
          }
        }
        else if($win.outerWidth() > _this.options.breakPoint && _this.state.dropDownInitialised === 1){
          while(_this.childListItems.length > 0){
            _this.parentListItems.push(_this.parentListItems.shift());
            _this.paintDropDown();
            _this.resetState();
            _this.updateAttributes(); 
          }
        }
      }
      else{
        if(prevSrcWidth >= newSrcWidth) {
          
          if (_this.listItemsWidth > newSrcWidth - _this.options.buttonWidth) {
            /* Pop elements out of the nav till there is enough space to put rest of the items and button */
            while(_this.listItemsWidth > newSrcWidth - _this.options.buttonWidth) {
              lastItem = _this.parentListItems.pop();
              _this.listItemsWidth -= $(lastItem).outerWidth();
              _this.childListItems.unshift(lastItem);
            }
            _this.paintDropDown();
            _this.state.dropDownInitialised = 1;
            _this.updateAttributes();
          }
        } else {
          if(_this.state.dropDownInitialised == 1) {
            firstItem = _this.childListItems[0];
            /* Pop items from the drop down and push to main nav */
            while( _this.listItemsWidth + $(firstItem).outerWidth() + _this.options.buttonWidth < newSrcWidth) {
              _this.listItemsWidth += $(firstItem).outerWidth();
              firstItem = _this.childListItems.shift();
              _this.parentListItems.push(firstItem);
              if($(firstItem).length == 0) break;
            }
            _this.paintDropDown(); 
          }
        }
      }
      _this.srcElementWidth = newSrcWidth;
    },

    /**
     * Bind events on the nav bar
     * @return {Void}
     */
    bindEvents: function() {
      var _this = this;

      $win.off(eventNamespaceSuffix).on('resize' + eventNamespaceSuffix, _this.render.bind(_this));

      // list items
      _this.$li = _this.elements.list.find('li');

      // Dropdown focus events
      _this.elements.button.off().on({
        click: function(e) {
          if(_this.state.dropDownInitialised) {
            // toggle open state
            _this.state.opened ? _this.close() : _this.open(e);
          }
        }
      });

      // Handle menulist item events.
      _this.elements.list.on('click' + eventNamespaceSuffix, 'li', function(e) {
        var itemIndex = $(this).index();
        _this.select(itemIndex);
        return false;
      });
      _this.elements.list.on('focusin' + eventNamespaceSuffix, 'li', function(e) {
        var itemIndex = $(this).index();

        _this.highlight(e, itemIndex);
      });
      _this.bindKeyDownEvent();
    },

    /**
     * bind keydown events on document to handle directional keys for dropdown.
     * @return {Void}
     */
    bindKeyDownEvent: function() {
      var _this = this;

      // Handle key events.
      $doc.off(eventNamespaceSuffix).on('keydown' + eventNamespaceSuffix, $.proxy(_this.keyHandler, _this));
    },

    /**
     * Open the dropdown box
     *
     * @param {Event} e - Event
     */
    open: function(e) {
      var _this = this;

      _this.utils.triggerCustomEvent('BeforeOpen', _this);

      if ( e ) {
        e.preventDefault();
        e.stopPropagation();
      }

      _this.state.opened = true;
      _this.updateAttributes();
      _this.bindKeyDownEvent();
      
      // Prevent window scroll when using mouse wheel inside dropdown box
      $doc.on('mousewheel' + eventNamespaceSuffix + ' DOMMouseScroll' + eventNamespaceSuffix, function(e) {
        var orgEvent = e.originalEvent;
        var scrollTop = $(this).scrollTop();
        var deltaY = 0;

        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1; }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;  }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY; }
        if ( 'deltaY'      in orgEvent ) { deltaY = orgEvent.deltaY * -1; }

        if ( scrollTop === (this.scrollHeight - _this.itemsHeight) && deltaY < 0 || scrollTop === 0 && deltaY > 0 ) {
          e.preventDefault();
        }
      });
      
      // Auto scroll dropdown to currently active item.
      _this.autoScrollItemList(_this.state.selectedIdx);

      // Select currently active item 
      _this.select(_this.state.selectedIdx);

      _this.utils.triggerCustomEvent('Open', _this);
    },

    /**
     * Detect if currently active menuitem is visible and scroll the dropdown box to show it
     *
     * @param {Number|Array} index - Index of the selected items
     */
    autoScrollItemList: function(index) {
      var _this = this;

       // Parameter index is required
      if ( index === undefined || index === -1) {
        return;
      }

      var liHeight = _this.$li.eq(index).outerHeight();
      var liTop = _this.$li[index].offsetTop;
      var itemsWrapperTop = _this.elements.itemsWrapper.scrollTop();
      var scrollT = liTop + liHeight * 2;

      _this.elements.itemsWrapper.scrollTop(
        scrollT > itemsWrapperTop + _this.itemsHeight ? scrollT - _this.itemsHeight :
          liTop - liHeight < itemsWrapperTop ? liTop - liHeight :
            itemsWrapperTop
      );
    },

    /**
     * Highlight option
     * @param {number} index - Index of the options that will be highlighted
     */
    highlight: function(event, index) {
      var _this = this;

      // Parameter index is required
      if ( index === undefined || index === -1) {
        return;
      }

      _this.utils.triggerCustomEvent('BeforeHighlight', _this);
      
      // Remove already highlighted item in the list.
      // And highlight current index item.
      _this.$li
        .removeClass(_this.classes.highlighted)
        .eq(_this.state.highlightedIdx = index)
        .addClass(_this.classes.highlighted);

      if(event.type === 'keydown') {
        _this.$li.eq(_this.state.highlightedIdx).find('a').focus(); // set focus on link
      }

      _this.autoScrollItemList(index);

      _this.utils.triggerCustomEvent('Highlight', _this);

    },

    /**
     * Select option
     *
     * @param {number} index - Index of the option that will be selected
     */
    select: function(index) {
      var _this = this;

      _this.utils.triggerCustomEvent('BeforeSelect', _this, index);

      // Parameter index is required
      if (index === undefined || index === -1) {
        return;
      }

      // Set active state on selection.
      _this.$li
        .removeClass(_this.classes.selected)
        .removeAttr('aria-activedescendant aria-selected')
        .eq(_this.state.selectedIdx = _this.state.highlightedIdx = index)
        .addClass(_this.classes.selected)
        .attr({
          'aria-activedescendant': true,
          'aria-selected': true
        });

      _this.utils.triggerCustomEvent('Selected', _this, index);

    },

    /**
     * Update dropdown elements attributes on open and close state.
     * @return {void}
     */
    updateAttributes: function() {

      var _this = this;

      if(_this.state.dropDownInitialised) {
        _this.elements.childListWrap.removeClass('m-navigation-close').addClass('m-navigation-open');
      } else {
        _this.elements.childListWrap.removeClass('m-navigation-open').addClass('m-navigation-close');
        return;
      }

      // outer wrapper of dropdown
      _this.elements.outerWrapper.attr({
        'aria-hidden': !_this.state.opened,
        'aria-expanded': _this.state.opened
      });

      // remove already highlighted item in the list when dropdown is closed.
      if(!_this.state.opened) {
        _this.$li.removeClass(_this.classes.highlighted);
        _this.state.highlightedIdx = -1;
      }

      if(_this.state.opened) {
        _this.elements.outerWrapper.addClass(_this.classes.open);
        _this.elements.icon.removeClass('t-icon-arrow-down').addClass('t-icon-navigation-close');
        _this.elements.list.removeClass('drop-down-close');
      } else {
        _this.elements.outerWrapper.removeClass(_this.classes.open);
        _this.elements.icon.removeClass('t-icon-navigation-close').addClass('t-icon-arrow-down');
        _this.elements.list.addClass('drop-down-close');
      }
    },

    /**
     * Close the dropdown box.
     * @return {void}
     */
    close: function() {
      var _this = this;

      _this.utils.triggerCustomEvent('BeforeClose', _this);

      // Reset open state
      _this.state.opened = false;
      _this.updateAttributes();

      _this.utils.triggerCustomEvent('Close', _this);
    },

    /**
     * Reset to initial state on dropdown empty.
     * @return {void}
     */
    resetState: function() {
      var _this = this;

      _this.state = {
        opened         : false,
        selectedIdx    : -1,
        highlightedIdx : -1,
        dropDownInitialised: 0,
      };
    },

    /**
     * Behavior when keyboard keys is pressed
     *
     * @param {object} e - Event object
     */
    keyHandler: function(e) {
      var _this = this,
        key = e.keyCode || e.which,
        keys = _this.options.keys,
        isPrevKey = $.inArray(key, keys.previous) > -1,
        isNextKey = $.inArray(key, keys.next) > -1,
        isEnter = $.inArray(key, keys.enter) > -1,
        isEscape = $.inArray(key, keys.escape) > -1,
        isTab = $.inArray(key, keys.tab) > -1,
        idx = _this.state.highlightedIdx,
        totalItems = _this.$li.length,
        isFirstOrLastItem = (isPrevKey && idx === 0) || (isNextKey && (idx + 1) === totalItems),
        goToItem = 0;

      // if dropdown not initialised yet.
      if(!_this.state.dropDownInitialised)
        return;

      // Enter / Space
      if ( key === 13 || key === 32 ) {
        e.preventDefault();
      }

      if(_this.state.opened) {
        // If it's a directional key
        if (isPrevKey || isNextKey) {
          if ( !_this.options.allowWrap && isFirstOrLastItem ) {
            return;
          }

          if ( isPrevKey ) {
            goToItem = _this.state.highlightedIdx > 0 ? --_this.state.highlightedIdx : --totalItems;
          }

          if ( isNextKey ) {
            goToItem = _this.state.highlightedIdx === (totalItems-1) ? 0 : ++_this.state.highlightedIdx;
          }
          _this.highlight(e, goToItem);
          return;
        }

        // Toggle Dropdown on button enter press.
        if(_this.elements.button.is(':focus') && isEnter) {
          _this.close();
          return;
        }

        // Select highlighted item on enter.
        if(isEnter && idx !== -1 && (_this.$li.eq(idx).is(':focus') || _this.$li.eq(idx).hasClass('highlighted'))) { 
          _this.select(idx);
          _this.close();
          return;
        }

        // Highlight item on tab.
        if(isTab && idx !== -1) {
          //_this.$li.eq(idx).focus();
          if(idx === (_this.$li.length - 1) && _this.options.allowWrap)  {
            idx = 0; // wrap to first item.
            _this.$li.eq(idx).find('a').focus();
            e.preventDefault();
          } else {
            _this.highlight(e, idx);
          }
          return;
        }

        // Close dropdown.
        if(isEscape) {
          _this.close();
          return;
        }
      } else {
        // check if dropdown button is on focus. If yes, then open dropdown.
        if(_this.elements.button.is(':focus') && isEnter) {
          _this.open();
          return;
        }
      }

    }

  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function(args) {
    return this.each(function() {
      var data = $.data(this, pluginName);

      if ( data && !data.disableOnMobile ) {
        (typeof args === 'string' && data[args]) ? data[args]() : data.init(args);
      } else {
        $.data(this, pluginName, new responsiveNav(this, args));
      }
    });
  };

  /**
   * Default plugin options
   *
   * @type {object}
   */
  $.fn[pluginName].defaults = {
    allowWrap            : true,
    breakPoint           : null,           // Integer value where complete dropdown to be shown
    showLabel            : false,
    theme                : 'grey',         // Possbile values: grey / blue 
    keys                 : {
      previous : [37, 38],                 // Left / Up
      next     : [39, 40],                 // Right / Down
      enter    : [13],                     // Enter
      tab      : [9],                      // Tab
      escape   : [27]                      // Space
    },
    customClass          : {
      prefix: 'resnav'
    },
  };

}));