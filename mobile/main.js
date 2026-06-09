import Vue from "vue";
import App from "./App";
import theme from "./theme/index.js";

Vue.config.productionTip = false;
Vue.prototype.$theme = theme;
App.mpType = "app";

const app = new Vue({
  ...App
});

app.$mount();
