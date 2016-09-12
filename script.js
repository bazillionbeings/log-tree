(function() {
  'use strict';
  const HOST = 'http://54.149.208.215:8880/';
  // const HOST = 'http://192.168.4.56:4242/';
  const ROW_HEIGHT = 60;
  const CLONE_COUNT = 20;
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

  function getNewJQItem(item) {
    const $tr = $('<tr>');

    if (item.action === 'clone') {
      let $td = $('<td>');
      $tr.append($td);
      let $div = $('<div>');
      $td.append($div);
      $div.css('background-color', item.color.substring(0, item.color.length - 2));

      $td = $('<td>');
      $tr.append($td);
      $div = $('<div>');
      $td.append($div);
      item.parentIds.reverse().forEach(parentId => {
        let $img = $('<img>').attr('src', `${HOST}v1/me/serviceFile/${parentId}/lifo_x1_phone.png`).attr('height', 55).attr('width', 55);
        $div.append($img);
      });

      let $img = $('<img>').attr('src', `${HOST}v1/me/serviceFile/${item.service_id}/lifo_x1_phone.png`).attr('height', 55).attr('width', 55);
      $div.append($img);
    } else {
      let $td = $('<td>');
      $tr.append($td);
      let $div = $('<div>');
      $td.append($div);
      $td = $('<td>');
      $tr.append($td);
      $div = $('<div>');
      $td.append($div);
      let $img = $('<img>').attr('src', `${HOST}v1/me/serviceFile/${item.service_id}/lifo_x1_phone.png`).attr('height', 55).attr('width', 55);
      $div.append($img);
    }
    let $td = $('<td>');
    $tr.append($td);
    let $div = $('<div>');
    $td.append($div);
    $div.html(`<b>${item.name}</b> ${item.message}`);

    $td = $('<td>');
    $div = $('<div>');
    $td.append($div);

    (function(item, $div) {
      let seconds = Math.round(item.creationTimeAgo / 1000);
      let startTime = new Date().getTime();
      let originalCreationTime = item.creationTimeAgo;
      let interval = setInterval(() => {
        let curentTime = new Date().getTime();
        let result = seconds + Math.round((curentTime - startTime) / 1000);
        item.creationTimeAgo = originalCreationTime + (curentTime - startTime);
        if (result > 60) {
          let minutes = Math.round(result / 60);
          $div.html(minutes + (minutes > 1 ? ' minutes ago': ' minute ago'));
        } else {
          $div.html(result + (result > 1 ? ' seconds ago': ' second ago'));
        }
      },1000);
      item.interval = interval;
    }) (item, $div);
    let seconds = Math.round(item.creationTimeAgo / 1000);
    if (seconds > 60) {
      let minutes = Math.round(seconds / 60);
      $div.html(minutes + (minutes > 1 ? ' minutes ago': ' minute ago'));
    } else {
      $div.html(seconds + (seconds > 1 ? ' seconds ago': ' second ago'));
    }
    $tr.append($td);

    $td = $('<td>');
    $div = $('<div>');
    $td.append($div);
    $div.html(item.session_id.substring(0, 20));
    $tr.append($td);
    $.data($tr, item);
    item.element = $tr;
    return $tr;
  }

  function formatList(unformattedList) {
    function insert(item) {
      if (list.length < amount) {
        list.unshift(item);
      } else {
        let lowestCount = Number.MAX_VALUE;
        let lowestCountItems = [];
        list.forEach((item, i) => {
          if(item.state !== 'deleting') {
            if (item.count < lowestCount) {
              lowestCountItems = [];
              lowestCountItems.push(item);
              lowestCount = item.count;
            } else if (item.count === lowestCount) {
              lowestCountItems.push(item);
            }
          }
        });
        lowestCountItems.sort((a, b) => a.creationTimeAgo - b.creationTimeAgo);

        let deleteItem = lowestCountItems[lowestCountItems.length - 1];
        console.log(deleteItem);
        deleteItem.state = 'deleting';



        let $tr = getNewJQItem(item);
        list.unshift(item);
        $tr.find('div').addClass('tranistion-row');
        $('table').prepend($tr);

        (function(deleteItem, $tr) {
          let counter = 0;
          setTimeout(() => {
            deleteItem.element.find(`td > div`).addClass('tranistion-row')
              .one('transitionend ', (event) => {
                counter++;
                if (counter === 5) {
                  deleteItem.element.remove();
                  clearInterval(deleteItem.interval);
                  list.splice(list.indexOf(deleteItem), 1);
                }
              });

            $tr.find('div').removeClass('tranistion-row');

          }, 100);
        })(deleteItem, $tr);
      }
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
      list.sort((a, b) => a.creationTimeAgo - b.creationTimeAgo);
      list.forEach(item => {
        let $tr = getNewJQItem(item);
        $table.append($tr);
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
        data = data.data;
        data.forEach(item => {
          if (item.id > lastId) lastId = item.id;
        });
        data = data.splice(0, amount);
        formatList(data);
      }
      if (list) {
        list.forEach(item => {
          item.count = item.count > 0 ? item.count - 1: 0;
        });
      }

    });
  }, REFRESH_INTERVAL);

})();
