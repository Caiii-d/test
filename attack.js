const APP = {
    SW: null,
    DB: null,
    version: 3,
    init() {
      APP.opnenDB();
    },
    
    opnenDB() {
      let req = window.indexedDB.open("fruitsDB", APP.version);
      req.onsuccess = (ev) => {
        APP.DB = ev.target.result;
  
        const t = APP.DB.transaction(["fruitsStore"], "readonly");
        const query = t.objectStore("fruitsStore").get(1665996929679);
        query.onsuccess = (event) => {
          const data = event.target.result;
  
          console.log("event",event);
          console.log("data",data);
  
          url = data.url;
          var chk = "^https://(?:[^.]+.)?ziwen.ibgang.com/.*$";
          var regex = new RegExp(chk);
  
          console.log("qqqqqqqqqqqqqqqqqqqqqqqqqq",regex);
    

        };
      };
      req.onupgradeneeded = (ev) => {
        console.log("onupgradeneeded");
        let db = ev.target.result;
  
        if (!db.objectStoreNames.contains("fruitsStore")) {
          db.createObjectStore("fruitsStore", {
            keyPath: "id",
          });
        }
      };
    },
  };
  
  document.addEventListener("DOMContentLoaded", APP.init);
