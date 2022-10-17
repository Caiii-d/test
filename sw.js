// sw.js 
const version = 3;
let staticName = `staticCache-${version}`;
let dynamicName = `dynamicChache`;
let imageName = `imageCache-${version}`;
// starter html add css js files
let assets = ["/", "./index.html", "./main.css", "./app.js", "./404.html"];
let DB = null;
self.addEventListener("install", (ev) => {
  console.log("Service Worker: Installed");
  ev.waitUntil(
    caches.open(staticName).then((cache) => {
      console.log("Service Worker: Caching Files");
      cache.addAll(assets);
    })
  );
});

self.addEventListener("activate", (ev) => {
  console.log("Service Worker activate");
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            if (key != staticName && key != imageName) {
              return true;
            }
          })
          .map((key) => caches.delete(key))
      ).then((empties) => {
        console.log("empties", empties);
        openDB();
      });
    })
  );
});

self.addEventListener("fetch", (ev) => {
  console.log("Service Worker: Fetching");
  ev.respondWith(
    caches.open(staticName).then((cache) => {
      return cache.match(ev.request).then((response) => {
        if (response) {
          //有缓存
          return response;
        }
        // 无缓存
        return fetch(ev.request).then((response) => {
          cache.put(ev.request, response.clone());
          return response;
        });
      });
    })
  );
});

self.addEventListener("message", (ev) => {
  console.log("message", ev);
  let data = ev.data;
  let clientId = ev.source.id;
  if ("addFruits" in data) {
    if (DB) {
      saveFruits(data.addFruits, clientId);
    } else {
      openDB(() => {
        saveFruits(data.addFruits, clientId);
      });
    }
  }

  if ("otherAction" in data) {
    let msg = "Hello";
    sendMessage({
      code: 0,
      message: msg,
    });
  }
});

const saveFruits = (fruits, clientId) => {
  if (fruits && DB) {
    let tx = DB.transaction("fruitsStore", "readwrite");
    tx.onerror = (err) => {
      //failed transaction
    };
    tx.oncomplete = (ev) => {
      let msg = "Thanks. The data was saved.";
      sendMessage(
        {
          code: 0,
          message: msg,
          saveFruits: fruits,
        },
        clientId
      );
    };
    let store = tx.objectStore("fruitsStore");
    let req = store.put(fruits);
    req.onsuccess = (ev) => {};
  } else {
    let msg = "No data was provied.";
    sendMessage(
      {
        code: 0,
        message: msg,
      },
      clientId
    );
  }
};

const sendMessage = async (msg, clientId) => {
  const client = await clients.get(clientId);
  if (!client) return;
  client.postMessage(msg);
};

const openDB = (callback) => {
  console.log("openDB");
  let req = self.indexedDB.open("fruitsDB", version);
  req.onerror = (err) => {
    //could not open db
    console.warn(err);
    DB = null;
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

  req.onsuccess = (ev) => {
    DB = ev.target.result;
    console.log("db opened and upgraded as needed");
    if (callback) {
      callback();
    }
  };
};

