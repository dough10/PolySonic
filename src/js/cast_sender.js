(function() {var CastApiBootstrap = function() {
};
CastApiBootstrap.CAST_API_FILE_ = document.currentScript && -1 != document.currentScript.src.indexOf("?loadGamesSDK") ? "/cast_game_sender.js" : "/cast_sender.js";
CastApiBootstrap.CAST_EXTENSION_IDS_ = "boadgeojelhgndaghljhdicfkmllpafd dliochdbjfkdbacpmhlcpmleaejidimm hfaagokkkhdbgiakmmlclaapfelnkoah fmfcbgogabcbclcofgocippekhfcmgfj enhhojjnijigcajfphajepfemndkmdlo eojlgccfgnjlphjnlopmadngcgmmdgpk".split(" ");
CastApiBootstrap.MR_EXTENSION_IDS_ = ["fjhoaacokmgbjemoflkofnenfaiekifl", "ekpaaapppgpmolpcldedioblbkmijaca", "lhkfccafpkdlaodkicmokbmfapjadkij", "ibiljbkambkbohapfhoonkcpcikdglop"];
CastApiBootstrap.EXTENSION_IDS_ = window.navigator.presentation ? CastApiBootstrap.CAST_EXTENSION_IDS_.concat(CastApiBootstrap.MR_EXTENSION_IDS_) : CastApiBootstrap.CAST_EXTENSION_IDS_;
CastApiBootstrap.findInstalledExtension_ = function(callback) {
  window.chrome ? CastApiBootstrap.findInstalledExtensionHelper_(0, callback) : callback(null);
};
CastApiBootstrap.findInstalledExtensionHelper_ = function(index, callback) {
  index == CastApiBootstrap.EXTENSION_IDS_.length ? callback(null) : CastApiBootstrap.isExtensionInstalled_(CastApiBootstrap.EXTENSION_IDS_[index], function(installed) {
    installed ? callback(CastApiBootstrap.EXTENSION_IDS_[index]) : CastApiBootstrap.findInstalledExtensionHelper_(index + 1, callback);
  });
};
CastApiBootstrap.getCastSenderUrl_ = function(extensionId) {
  return "chrome-extension://" + extensionId + CastApiBootstrap.CAST_API_FILE_;
};
CastApiBootstrap.isExtensionInstalled_ = function(extensionId, callback) {
  var xmlhttp = new XMLHttpRequest;
  xmlhttp.onreadystatechange = function() {
    4 == xmlhttp.readyState && 200 == xmlhttp.status && callback(!0);
  };
  xmlhttp.onerror = function() {
    callback(!1);
  };
  try {
    xmlhttp.open("GET", CastApiBootstrap.getCastSenderUrl_(extensionId), !0), xmlhttp.send();
  } catch (e) {
    callback(!1);
  }
};
CastApiBootstrap.findInstalledExtension = function() {
  CastApiBootstrap.findInstalledExtension_(function(extensionId) {
    if (extensionId) {
      window.chrome = window.chrome || {};
      window.chrome.cast = window.chrome.cast || {};
      window.chrome.cast.extensionId = extensionId;
      var apiScript = document.createElement("script");
      apiScript.src = CastApiBootstrap.getCastSenderUrl_(extensionId);
      (document.head || document.documentElement).appendChild(apiScript);
    } else {
      var callback = window.__onGCastApiAvailable;
      callback && "function" == typeof callback && callback(!1, "No cast extension found");
    }
  });
};
CastApiBootstrap.findInstalledExtension();
})();
