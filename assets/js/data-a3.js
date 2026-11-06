/* Values reported by the book's When-Prediction-Fails coupon simulation. */
(function (g) {
  var data = {"n":10000,"couponCounts":{"0":458,"5":4749,"10":4154,"15":639},"corr":{"age":0.897308,"netValue":-0.078369},"r2":{"train":0.5382953634651921,"test":0.504563847410434},"gain":{"simple":252.9268,"model":229.9341,"loss":22.9927},"bands":{"band":[1,2,3,4,5,6,7,8,9,10],"coupon":[10,5,5,10,5,10,10,10,15,5]}};
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  g.A3Data = data;
})(typeof window !== 'undefined' ? window : globalThis);
