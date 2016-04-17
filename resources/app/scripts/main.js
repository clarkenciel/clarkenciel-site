var body = document.getElementsByTagName("body")[0];

var removeClasses = function (element, classList) {
  classList.forEach(function (c) { element.classList.remove(c); });
  return element;
};

var addClasses = function (element, classList) {
  classList.forEach(function (c) { element.classList.add(c); });
  return element;
};

var swapClasses = function (element, oldClasses, newClasses) {
  return addClasses(removeClasses(element, oldClasses), newClasses);
};

var bigRedGrow = function (d) {
  return function (e) {
    body.appendChild(clone(swapClasses(d,
                                       ["black_text", "normal_text"],
                                       ["red_text", "big_text"])));
  };
};

var smallBlack = function (d) {
  return function (e) {
    swapClasses(d, ["red_text", "big_text"], ["black_text", "normal_text"]);
  };
};

var initNode = function (node) {  
  node.onmouseenter = bigRedGrow(node);
  node.onmouseleave = smallBlack(node);
  return node;
};

var clone = function (sourceNode, deep) {
  if (typeof deep === "undefined") deep = true;
  return initNode(sourceNode.cloneNode(deep));
};

var charDivs = "Danny Clarke...Clarkenciel".split("").map(function (c) {
  var d = document.createElement("div");
  var h = document.createElement("h1");
  h.innerText = c;
  d.appendChild(h);
  addClasses(d, ["character", "normal_text", "black_text"]);  
  return initNode(d);
});

charDivs.forEach(function (d) {
  body.appendChild(d);
});

document.addEventListener("touchmove", function (e) {
  var touch = e.touches[0],
      x = touch.clientX,
      y = touch.clientY;

  [].slice.call(document.getElementsByClassName("character")).forEach(function (node) {
    if ((node.offsetLeft <= x && x <= node.offsetLeft + node.offsetWidth)
        &&
        (node.offsetTop <= y && y <= node.offsetTop + node.offsetHeight))
      bigRedGrow(node)();
    else
      smallBlack(node)();
  });
});
