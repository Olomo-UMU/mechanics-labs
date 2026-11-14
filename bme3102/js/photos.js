/* photos.js: real-part photos fetched in the browser from the Wikimedia Commons API.
   A missing photo shows a plain message and never breaks the page. */
(function () {
  'use strict';
  var API = 'https://commons.wikimedia.org/w/api.php';
  var cache = {};
  function strip(html) { var d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').trim(); }
  function pick(pages) {
    var list = Object.keys(pages || {}).map(function (k) { return pages[k]; });
    list.sort(function (a, b) { return (a.index || 0) - (b.index || 0); });
    for (var i = 0; i < list.length; i++) {
      var ii = list[i].imageinfo && list[i].imageinfo[0];
      if (ii && /\.(jpe?g|png)$/i.test(ii.url || '')) return { title: list[i].title, ii: ii };
    }
    return null;
  }
  function fetchJSON(url) { return fetch(url, { mode: 'cors' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }); }
  /* name: "File:..." or "Category:..." ; returns Promise of {src, author, licence, licenceUrl, page} */
  window.commonsPhoto = function (name) {
    if (cache[name]) return cache[name];
    var q = 'action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=720';
    var url = /^Category:/.test(name)
      ? API + '?' + q + '&generator=categorymembers&gcmtype=file&gcmlimit=12&gcmtitle=' + encodeURIComponent(name)
      : API + '?' + q + '&titles=' + encodeURIComponent(name);
    function search(term) {
      return fetchJSON(API + '?' + q + '&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=' + encodeURIComponent(term)).then(function (j) { var p = pick(j.query && j.query.pages); if (!p) throw new Error('no image'); return p; });
    }
    cache[name] = fetchJSON(url).then(function (j) {
      var p = pick(j.query && j.query.pages);
      if (!p && /^Category:/.test(name)) return search(name.replace(/^Category:/, '').replace(/\(.*\)/, ''));
      if (!p) throw new Error('no image');
      return p;
    }).then(function (p) {
      var md = p.ii.extmetadata || {};
      return {
        src: p.ii.thumburl || p.ii.url,
        author: strip(md.Artist && md.Artist.value) || 'unknown author',
        licence: strip(md.LicenseShortName && md.LicenseShortName.value) || 'see file page',
        licenceUrl: md.LicenseUrl && md.LicenseUrl.value,
        page: p.ii.descriptionurl
      };
    });
    return cache[name];
  };
  window.renderPhoto = function (box, name, alt) {
    box.innerHTML = '<small class="muted">Loading photo of the real part.</small>';
    window.commonsPhoto(name).then(function (p) {
      var lic = p.licenceUrl ? '<a href="' + p.licenceUrl + '" target="_blank" rel="noopener">' + p.licence + '</a>' : p.licence;
      box.innerHTML = '<img loading="lazy" alt="' + (alt || '').replace(/"/g, '') + '" src="' + p.src + '">' +
        '<small>Photo: ' + p.author.slice(0, 80) + ', <a href="' + p.page + '" target="_blank" rel="noopener">Wikimedia Commons</a>, ' + lic + '</small>';
    }).catch(function () {
      box.innerHTML = '<small class="muted">Photo not available: it loads from Wikimedia Commons when you are online.</small>';
    });
  };
  /* figures in the text: <figure class="photo" data-commons="File:..." data-cap="..."> */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('figure.photo[data-commons]').forEach(function (fig) {
      var box = document.createElement('div'); fig.appendChild(box);
      window.renderPhoto(box, fig.dataset.commons, fig.dataset.cap);
      if (fig.dataset.cap) { var c = document.createElement('figcaption'); c.textContent = fig.dataset.cap; fig.appendChild(c); }
    });
  });
})();
