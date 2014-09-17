(function() {

  document.addEventListener('DOMContentLoaded', function() {

    var compareUrl = 'http://catalog.onliner.by/compare/';
    var compareUrlDelimiter = '+';

    var dom = {
      compareLink: document.querySelector('.compare'),
      addButton: document.querySelector('.onliner-comparison-extension-popup-add-button'),
      list: document.querySelector('.products')
    };

    var templates = {
      item: '<img src="" title="" alt="" align="left"><a href="" target="_blank" title="Открыть в новой вкладке"></a><p></p><button class="remove" title="Удалить из сравнения">&#10006;</button>'
    };

    var products = {
      list: [],
      load: function() {
        var that = this;

        chrome.storage.local.get(null, function(data) {

          var list = data.products;
          for (var i = 0; i < list.length; i++) {
            that.add(list[i], true);
          }

          that.updateCompareUrl();
        });
      },
      add: function(product, silent) {
        silent = silent || false;
        var that = this;

        for (var i in this.list) {
          if (this.list[i].id === product.id) {
            return false;
          }
        }

        this.list.push(product);

        var listItem = document.createElement('li');

        listItem.className = 'product';
        listItem.dataset.id = product.id;
        listItem.innerHTML = templates.item;

        var img = listItem.querySelector('img');
        img.src = product.imageUrl;
        img.title = img.alt = product.title;

        var link = listItem.querySelector('a');
        link.href = product.url;
        link.innerHTML = product.title;

        var p = listItem.querySelector('p');
        p.innerHTML = product.description;

        var button = listItem.querySelector('button');
        button.addEventListener('click', function() {

          var parent = this.parentNode;
          var id = parent.dataset.id;

          that.remove(id);

        });

        dom.list.appendChild(listItem);

        if (silent === false) {
          this.updateStorage();
          this.updateCompareUrl();
        }
      },
      remove: function(id) {

        for(var i = 0; i < this.list.length; i++) {
          if (this.list[i].id === id) {
            this.list.splice(i, 1);
            dom.list.querySelector('[data-id="' + id + '"]').remove();
            break;
          }
        }

        this.updateStorage();
        this.updateCompareUrl();
      },
      updateCompareUrl: function() {

        var ids = [];
        for (var i = 0; i < this.list.length; i++) {
          ids.push(this.list[i].id);
        }

        var productsStr = ids.join(compareUrlDelimiter);
        dom.compareLink.href = compareUrl + productsStr;
      },
      updateStorage: function() {
        chrome.storage.local.set({ products: this.list }, function() {});
      }
    };


    products.load();

    dom.addButton.addEventListener('click', function() {

      chrome.tabs.executeScript(null, {
        file: 'javascripts/inject.js'
      });

    });

    chrome.extension.onMessage.addListener(function(request, sender) {
      if (request.action == 'parseProduct') {
        products.add(request.source);
      }
    });

  });
})();

