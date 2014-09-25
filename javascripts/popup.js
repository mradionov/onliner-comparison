// this script will run any time user opens a popup

// shortcut for sending a message
function sendMessage(action, data, callback) {
  var message = { action: action, source: 'popup', data: data };
  chrome.extension.sendMessage(message, callback);
}

document.addEventListener('DOMContentLoaded', function() {

  // base url for comparison
  var compareUrl = 'http://catalog.onliner.by/compare/';
  // products ids delimiter in compare url
  var compareUrlDelimiter = '+';

  var domElements = {
    compareLink: document.querySelector('.compare'),
    addButton: document.querySelector('.onliner-comparison-extension-popup-add-button'),
    list: document.querySelector('.products')
  };

  // template for a single product list item
  var templates = {
    product: '<img src="" title="" alt="" align="left"><a href="" target="_blank" title="Открыть в новой вкладке"></a><p></p><button class="remove" title="Удалить из сравнения">&#10006;</button>'
  };

  var viewManager = {

    // store ids of visible products
    // used to build a compare url
    ids: [],

    add: function(product) {
      var that = this;

      var li = document.createElement('li');
      li.className = 'product';
      li.dataset.id = product.id;
      li.innerHTML = templates.product;

      var img = li.querySelector('img');
      img.src = product.imageUrl;
      img.title = img.alt = product.title;

      var link = li.querySelector('a');
      link.href = product.url;
      link.innerHTML = product.title;

      var p = li.querySelector('p');
      p.innerHTML = product.description;

      var button = li.querySelector('button');
      button.addEventListener('click', function() {

        var parent = this.parentNode;
        var id = parent.dataset.id;

        that.remove(id);

      }, true);

      domElements.list.appendChild(li);

      // save added product id
      this.ids.push(product.id);

      this.updateCompareUrl();
    },
    remove: function(id) {
      var that = this;

      sendMessage('removeProduct', id, function(response) {
        // if product is deleted
        if (response === true) {
          // remove item from popup
          domElements.list.querySelector('[data-id="' + id + '"]').remove();

          // and from ids
          var index = that.ids.indexOf(id);
          if (index !== -1) {
            delete that.ids[index];
          }

          that.updateCompareUrl();
        }
      });
    },
    updateCompareUrl: function() {
      var productsStr = this.ids.join(compareUrlDelimiter);
      domElements.compareLink.href = compareUrl + productsStr;
    }
        
  };

  domElements.addButton.addEventListener('click', function() {
    sendMessage('parseProduct', null, function(response) {
      viewManager.add(response);
    });
  }, true);


  // load products when opening a popup
  sendMessage('loadProducts', null, function(products) {
    for (var i = 0; i < products.length; i++) {
      viewManager.add(products[i]);
    }
  });

});
