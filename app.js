// app.js
const APP = {
  SW: null,
  DB: null,
  version: 3,
  init() {
    // called after DOMContentLoaded
    // register our service worker
    APP.registerSW();
    document.getElementById("form").addEventListener("submit", APP.saveFruits);
    APP.opnenDB();
  },
  registerSW() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./sw.js", {
          scope: "./",
        })
        .then(
          (registration) => {
            APP.SW =
              registration.installing ||
              registration.waiting ||
              registration.active;
          },
          (error) => {
            console.log("Service worker registration failed:", error);
          }
        );
      //listen for the latest sw
      navigator.serviceWorker.addEventListener("controllerchange", async () => {
        APP.SW = navigator.serviceWorker.controller;
      });

      //listen for message from the service worker
      navigator.serviceWorker.addEventListener("message", APP.onMessage);
    } else {
      console.log("Service workers are not supported.");
    }
  },
  saveFruits(ev) {
    ev.preventDefault();
    let name = document.getElementById("name");
    let color = document.getElementById("color");
    let strName = name.value.trim();
    let strColor = color.value.trim();
    if (strName && strColor) {
      let fruits = {
        id: Date.now(),
        name: strName,
        color: strColor,
      };
      console.log("Save", fruits);
      APP.sendMessage({
        addFruits: fruits,
      });
    }
  },
  sendMessage(msg) {
    console.log("APP.SW", APP.SW);
    if (APP.SW) {
      console.log("msg", msg);
      APP.SW.postMessage(msg);
    }
  },
  onMessage({ data }) {
    //got a message from the service worker
    console.log("Web page receving", data);
    //TODO: check for saveFruits and build the list and clear the from
    if ("saveFruits" in data) {
      APP.showFruits();
      document.getElementById("name").value = "";
    }
  },
  showFruits() {
    console.log("showFruits", APP.DB);
    //TODO: check for DB
    if (!APP.DB) {
      APP.opnenDB();
    }
    //TODO: start transaction to read names and build the list
    try {
      let tx = APP.DB.transaction("fruitsStore", "readonly");
      let store = tx.objectStore("fruitsStore");
      let req = store.getAll();
      req.onsuccess = (ev) => {
        console.log("onsuccess");
        let list = document.getElementById("fList");
        let data = ev.target.result;
        list.innerHTML = data
          .map((fruits) => {
            console.log("show", fruits);
            return `<li data-id="${fruits.id}">
					${fruits.name}
					<input type="color" value="${fruits.color}" disabled />
				</li>`;
          })
          .join("\n");
      };
    } catch (err) {
      console.log("colorStore is no create");
    }
  },
  opnenDB() {
    let req = window.indexedDB.open("fruitsDB", APP.version);
    req.onsuccess = (ev) => {
      APP.DB = ev.target.result;
      APP.showFruits();
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

