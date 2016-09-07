(function() {
  'use strict';
  const HOST = 'http://localhost:4242/';
  const ROW_HEIGHT = 60;
  const CLONE_COUNT = 30;
  const REFRESH_INTERVAL = 1000;

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  let cloneCount = getParameterByName('count') || CLONE_COUNT;
  cloneCount = parseInt(cloneCount, 10);

  let amount = Math.floor($(window).outerHeight() / ROW_HEIGHT);

  $(window).resize(() => {
    amount = Math.floor($(window).outerHeight() / ROW_HEIGHT);
  });

  function formatList(unformattedList) {
    function insert(item) {
      if (list.length < amount) {
        list.unshift(item);
      } else {
        let lowestCount = Number.MAX_VALUE;
        let lowestCountItems = [];
        list.forEach((item, i) => {
          if (item.count < lowestCount) {
            lowestCountItems = [];
            lowestCountItems.push(item);
            lowestCount = item.count;
          } else if (item.count === lowestCount) {
            lowestCountItems.push(item);
          }
        });
        lowestCountItems.sort((a, b) => a.creationTimeAgo - b.coucreationTimeAgont);

        let deleteItem = lowestCountItems[lowestCountItems.length - 1];
        let deleteIndex = list.indexOf(deleteItem);
        $(`table tr:nth-child(${deleteIndex + 1})`).class()
        list[deleteIndex] = item;
      }
      list.sort((a, b) => a.creationTimeAgo - b.creationTimeAgo);
    }

    if (!list) {
      list = unformattedList.map(listItem => {
        if (listItem.action === 'clone'){
          listItem.count = cloneCount;
        } else {
          listItem.count = 0;
        }
        return listItem;
      });
    } else {
      let newItems = [];

      for (let newItem of unformattedList) {
        let found = false;
        for (let item of list) {
          if (newItem.id === item.id) {
            found = true;
            break;
          }
        }
        if (found === false) {
          if (newItem.action === 'clone'){
            newItem.count = cloneCount;
          } else {
            newItem.count = 0;
          }
          insert(newItem);
        }
      }

    }
  }

  let list;
  const $table = $('table');
  let lastId = 0;
  setInterval(() => {
    $.get(`${HOST}v1/me/log?amount=${amount}&lastId=${lastId}`, data => {
      if (data && data.data) {
        formatList(data.data);
        $table.html('');
        list.forEach(item => {
          const $tr = $('<tr>');
          $table.append($tr);

          if (item.action === 'clone') {
            let $td = $('<td>');
            $tr.append($td);
            $td.css('background-color', item.color.substring(0, item.color.length - 2));

            $td = $('<td>');
            $tr.append($td);
            item.parentIds.reverse().forEach(parentId => {
              let $img = $('<img>').attr('src', `${HOST}v1/me/serviceFile/${parentId}/lifo_x1_phone.png`).attr('height', 55).attr('width', 55);
              $td.append($img);
            });

            let $img = $('<img>').attr('src', `${HOST}v1/me/serviceFile/${item.service_id}/lifo_x1_phone.png`).attr('height', 55).attr('width', 55);
            $td.append($img);
          } else {
            let $td = $('<td>');
            $tr.append($td);
            $td = $('<td>');
            $tr.append($td);
            let $img = $('<img>').attr('src', `${HOST}v1/me/serviceFile/${item.service_id}/lifo_x1_phone.png`).attr('height', 55).attr('width', 55);
            $td.append($img);
          }
          let $td = $('<td>');
          $tr.append($td);
          const $div = $('<div>');
          $div.addClass('icon-name-holder');
          $td.append($div);

          const $divNameIcon = $('<div>');
          $divNameIcon.html(`<b>${item.name}</b> ${item.message}`);
          $div.append($divNameIcon);

          $td = $('<td>');
          if (item.creationTimeAgo > 60) {
            let minutes = Math.round(item.creationTimeAgo / 60);
            $td.html(minutes + (minutes > 1 ? ' minutes ago': ' minute ago'));
          } else {
            $td.html(item.creationTimeAgo + (item.creationTimeAgo > 1 ? ' secondes ago': ' seconde ago'));
          }
          $tr.append($td);

          $td = $('<td>');
          $td.html(item.session_id.substring(0, 20));
          $tr.append($td);
        });
        list.forEach(item => {
          item.count -= 1;
          if (item.id > lastId) lastId = item.id;
        });
      }
      list.forEach(item => item.count -= 1);
    });
  }, REFRESH_INTERVAL);

})();
