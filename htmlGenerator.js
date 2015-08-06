﻿var HtmlGenerator = function() {
  this.getHtml = function (node, title, navigationObject, navLevel) {
    var doc = docType() + tag('html', head(title, navLevel) + body(node, navigationObject));
    var dashRegex = new RegExp(String.fromCharCode(8211), 'g');
    var spaceRegex = new RegExp(String.fromCharCode(160), 'g');
    return doc.replace(dashRegex, '-').replace(spaceRegex, ' ');
  };

  function docType() {
    return '<!doctype html>';
  };

  function tag(tagName, content, attributes) {
    attributes = attributes || {};
    var attrString = Object.keys(attributes).map(function (item) {
      return (item == 'className' ? 'class' : item) + '="' + attributes[item] + '"';
    }).join(' ');
    attrString = attrString ? ' ' + attrString : '';
    return '<' + tagName + attrString + '>' + content + '</' + tagName + '>';
  };

  function head(title, navLevel) {
    return tag('head',
      tag('title', title) +
      tag('link', '', { rel: 'stylesheet', href: '../'.repeat(navLevel + 1) + 'stylesheets/style.css' }) +
      notesToggleFunction()
    );
  };

  function body(node, navigationObject) {
    return tag('body',
      tag('h1', 'BBC Audiences') +
      navigation(navigationObject) +
      pageContent(node)
    );
  };

  function navigation(navigationObject) {
    return navigationObject.map(function(navigationLinks, index) {
      return navigationBar(navigationLinks, index == 0);
    }).join('');
  };

  function navigationBar(navigationLinks, mainNav) {
    return tag('div', navigationLinks.map(function(link) {
      var attributes = { href: link.path };
      if (link.selected) {
        attributes.className = 'selected';
      }
      return tag('a', link.displayText, attributes);
    }).join(''), { className: mainNav ? 'mainNav' : 'localNav' });
  };

  function pageContent(node) {
    var contentNode = $(node).children('[text=Content]');
    if (contentNode.length == 0) {
      return tag('div', getNotes(node).join('\n'), { className: 'contentMissing' });
    }
    if (contentNode.children().first().attr('text')[0] == '#') {
      var nodeToFind = contentNode.children().first().attr('text').replace(/#/g, '');
      contentNode = $(node).children('[text*="' + nodeToFind + '"]').children('[text=Content]');
    }

    return $.makeArray(contentNode.children()).map(function(outline) {
      return placeholder(outline);
    }).join('');
  };

  function placeholder(node) {
    var notesLines = getNotes(node);
    var notesClasses = [ 'placeholder' ];
    $.each(notesLines, function (index, line) {
      notesClasses = notesClasses.concat(line.split(' ').filter(function(word) {
        return word.indexOf('#') == 0;
      }).map(function(className) {
        return className.substring(1);
      }));
    });
    var heading = stripText($(node).attr('text'));
    return tag('div', tag('h2', heading) + tag('span', notesLines.join('\n'), { className: 'note' }), { className: notesClasses.join(' ').toLowerCase() });
  };

  function getNotes(node) {
    return stripText($(node).attr('_note')).split('\n').filter(function(line) {
      return line.indexOf('~') != 0;
    });
  };

  function notesToggleFunction() {
    return tag('script',
      'window.onload = function() {' +
        'var body = document.body;' +
        'var list = [].slice.call(document.querySelectorAll("a"));' +
        'function getParameterByName(name) {' +
          'name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");' +
          'var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),' +
            'results = regex.exec(location.search);' +
          'return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));' +
        '}' +
        'function addNotes() {' +
          'body.classList.add("notes");' +
          'list.forEach(function(link) { link.setAttribute("href", link.getAttribute("href") + "?showNotes=1"); });' +
        '}' +
        'function removeNotes() {' +
          'body.classList.remove("notes");' +
          'list.forEach(function(link) { link.setAttribute("href", link.getAttribute("href").replace("?showNotes=1", "")); });' +
        '}' +

        'if (location.href.indexOf("?showNotes=1") > -1) {' +
          'addNotes();' +
        '}' +

        'document.onkeypress = function(e) {' +
          'var spaceKeyCode = 32;' +
          'if (e.keyCode == spaceKeyCode && e.shiftKey) {' +
            'if (body.classList.contains("notes")) {' +
              'removeNotes();' +
            '} else {' +
              'addNotes();' +
            '}' +
          '}' +
          'return false;' +
        '};' +
      '}'
    );
  };
};