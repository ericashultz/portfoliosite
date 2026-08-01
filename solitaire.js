(function () {
  "use strict";

  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var RED_SUITS = { H: true, D: true };
  var RANK_LABEL = { 1: "A", 11: "J", 12: "Q", 13: "K" };

  var PIP_LAYOUTS = {
    2: [[50, 22], [50, 78]],
    3: [[50, 22], [50, 50], [50, 78]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
    7: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72], [50, 39]],
    8: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72], [50, 39], [50, 61]],
    9: [[28, 28], [72, 28], [28, 43], [72, 43], [50, 50], [28, 57], [72, 57], [28, 72], [72, 72]],
    10: [[32, 28], [68, 28], [32, 43], [68, 43], [32, 57], [68, 57], [32, 72], [68, 72], [50, 35], [50, 65]]
  };

  var PIP_LAYOUTS_MOBILE = {
    2: [[50, 24], [50, 76]],
    3: [[50, 24], [50, 50], [50, 76]],
    4: [[32, 30], [68, 30], [32, 70], [68, 70]],
    5: [[32, 30], [68, 30], [50, 50], [32, 70], [68, 70]],
    6: [[32, 30], [68, 30], [32, 50], [68, 50], [32, 70], [68, 70]],
    7: [[32, 30], [68, 30], [32, 50], [68, 50], [32, 70], [68, 70], [50, 40]],
    8: [[32, 30], [68, 30], [32, 50], [68, 50], [32, 70], [68, 70], [50, 40], [50, 60]],
    9: [[32, 30], [68, 30], [32, 44], [68, 44], [50, 50], [32, 56], [68, 56], [32, 70], [68, 70]],
    10: [[34, 28], [66, 28], [34, 39], [66, 39], [34, 50], [66, 50], [34, 61], [66, 61], [34, 72], [66, 72]]
  };

  function pipLayoutFor(rank) {
    var layouts = window.matchMedia("(max-width: 720px)").matches ? PIP_LAYOUTS_MOBILE : PIP_LAYOUTS;
    return layouts[rank] || [];
  }

  var state = null;

  function rankLabel(r) {
    return RANK_LABEL[r] || String(r);
  }

  function isRed(suit) {
    return !!RED_SUITS[suit];
  }

  function cardOffset() {
    return window.matchMedia("(max-width: 720px)").matches ? 16 : 22;
  }

  function newDeck() {
    var deck = [];
    SUITS.forEach(function (suit) {
      for (var r = 1; r <= 13; r++) {
        deck.push({ suit: suit, rank: r, faceUp: false });
      }
    });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  function newGame() {
    var deck = newDeck();
    var tableau = [[], [], [], [], [], [], []];
    for (var col = 0; col < 7; col++) {
      for (var n = 0; n <= col; n++) {
        var card = deck.pop();
        card.faceUp = (n === col);
        tableau[col].push(card);
      }
    }
    var stock = deck;
    stock.forEach(function (c) { c.faceUp = false; });

    state = {
      stock: stock,
      waste: [],
      foundations: [[], [], [], []],
      tableau: tableau
    };

    document.getElementById("solWinMessage").hidden = true;
    render();
  }

  function makeCorner(card, isBottomRight) {
    var corner = document.createElement("div");
    corner.className = "sol-card-corner " + (isBottomRight ? "sol-card-corner-br" : "sol-card-corner-tl");

    var rankEl = document.createElement("div");
    rankEl.className = "sol-corner-rank";
    rankEl.textContent = rankLabel(card.rank);
    corner.appendChild(rankEl);

    var suitEl = document.createElement("div");
    suitEl.className = "sol-corner-suit";
    suitEl.textContent = SUIT_SYMBOL[card.suit];
    corner.appendChild(suitEl);

    return corner;
  }

  function makePip(suitSymbol, x, y) {
    var pip = document.createElement("span");
    pip.className = "sol-pip";
    pip.textContent = suitSymbol;
    pip.style.left = x + "%";
    pip.style.top = y + "%";
    if (y > 50) pip.style.transform = "translate(-50%, -50%) rotate(180deg)";
    return pip;
  }

  function makeFace(card) {
    var frame = document.createElement("div");
    frame.className = "sol-face";

    var letter = document.createElement("div");
    letter.className = "sol-face-letter";
    letter.textContent = rankLabel(card.rank);
    frame.appendChild(letter);

    var suitEl = document.createElement("div");
    suitEl.className = "sol-face-suit";
    suitEl.textContent = SUIT_SYMBOL[card.suit];
    frame.appendChild(suitEl);

    return frame;
  }

  function makeCardEl(card) {
    var el = document.createElement("div");
    el.className = "sol-card " + (card.faceUp ? (isRed(card.suit) ? "red" : "black") : "face-down");
    if (card.faceUp) {
      el.appendChild(makeCorner(card, false));
      el.appendChild(makeCorner(card, true));

      if (card.rank === 1) {
        var acePip = document.createElement("span");
        acePip.className = "sol-pip sol-pip-ace";
        acePip.textContent = SUIT_SYMBOL[card.suit];
        el.appendChild(acePip);
      } else if (card.rank >= 11) {
        el.appendChild(makeFace(card));
      } else {
        var layout = pipLayoutFor(card.rank);
        layout.forEach(function (pos) {
          el.appendChild(makePip(SUIT_SYMBOL[card.suit], pos[0], pos[1]));
        });
      }
    }
    return el;
  }

  function render() {
    renderSimplePile("solStock", state.stock.length ? [state.stock[state.stock.length - 1]] : [], false);
    renderSimplePile("solWaste", state.waste.slice(-2), false);

    for (var f = 0; f < state.foundations.length; f++) {
      var pile = state.foundations[f];
      renderSimplePile("foundation-" + f, pile.length ? [pile[pile.length - 1]] : [], false);
    }

    for (var col = 0; col < 7; col++) {
      renderTableauPile("tableau-" + col, state.tableau[col]);
    }

    checkWin();
  }

  function renderSimplePile(elId, cards, offset) {
    var container = document.getElementById(elId);
    container.innerHTML = "";
    cards.forEach(function (card) {
      var el = makeCardEl(card);
      el.style.left = "0px";
      el.style.top = "0px";
      attachHandlers(el, card);
      container.appendChild(el);
    });
  }

  function renderTableauPile(elId, cards) {
    var container = document.getElementById(elId);
    container.innerHTML = "";
    var offset = cardOffset();
    cards.forEach(function (card, idx) {
      var el = makeCardEl(card);
      el.style.left = "0px";
      el.style.top = (idx * offset) + "px";
      attachHandlers(el, card);
      container.appendChild(el);
    });
  }

  function locatePile(card) {
    if (state.waste.indexOf(card) !== -1) return { type: "waste", pile: state.waste };
    for (var f = 0; f < state.foundations.length; f++) {
      if (state.foundations[f].indexOf(card) !== -1) return { type: "foundation", index: f, pile: state.foundations[f] };
    }
    for (var col = 0; col < 7; col++) {
      var idx = state.tableau[col].indexOf(card);
      if (idx !== -1) return { type: "tableau", col: col, index: idx, pile: state.tableau[col] };
    }
    return null;
  }

  function canDrag(card) {
    if (!card.faceUp) return false;
    return true;
  }

  function movingStackFor(loc) {
    if (loc.type === "waste") return [state.waste[state.waste.length - 1]];
    if (loc.type === "tableau") return loc.pile.slice(loc.index);
    return null;
  }

  function canDropOnFoundation(card, foundationIndex) {
    var pile = state.foundations[foundationIndex];
    if (pile.length === 0) return card.rank === 1;
    var top = pile[pile.length - 1];
    return top.suit === card.suit && top.rank === card.rank - 1;
  }

  function findFoundationIndexFor(card) {
    for (var i = 0; i < state.foundations.length; i++) {
      var pile = state.foundations[i];
      if (pile.length > 0 && pile[pile.length - 1].suit === card.suit) {
        return canDropOnFoundation(card, i) ? i : -1;
      }
    }
    if (card.rank === 1) {
      for (var j = 0; j < state.foundations.length; j++) {
        if (state.foundations[j].length === 0) return j;
      }
    }
    return -1;
  }

  function canDropOnTableau(bottomCard, col) {
    var pile = state.tableau[col];
    if (pile.length === 0) return bottomCard.rank === 13;
    var top = pile[pile.length - 1];
    if (!top.faceUp) return false;
    return (isRed(top.suit) !== isRed(bottomCard.suit)) && (top.rank === bottomCard.rank + 1);
  }

  function removeFromSource(loc, stack) {
    if (loc.type === "waste") {
      state.waste.pop();
    } else if (loc.type === "tableau") {
      loc.pile.splice(loc.index, stack.length);
      if (loc.pile.length > 0) loc.pile[loc.pile.length - 1].faceUp = true;
    }
  }

  function tryAutoToFoundation(card) {
    var loc = locatePile(card);
    if (!loc) return false;
    var stack = movingStackFor(loc);
    if (!stack || stack.length !== 1) return false;
    var index = findFoundationIndexFor(card);
    if (index === -1) return false;
    removeFromSource(loc, stack);
    state.foundations[index].push(card);
    render();
    return true;
  }

  function attachHandlers(el, card) {
    card.el = el;

    el.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      tryAutoToFoundation(card);
    });

    el.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var loc = locatePile(card);
      if (!loc) return;

      if (loc.type === "foundation") return;

      var isTopOfPile = false;
      if (loc.type === "waste") isTopOfPile = true;
      if (loc.type === "tableau") isTopOfPile = (loc.index === loc.pile.length - 1) || card.faceUp;

      if (!canDrag(card)) return;

      var stack = movingStackFor(loc);
      if (!stack) return;

      e.preventDefault();
      e.stopPropagation();
      startDrag(stack, loc, e, el);
    });
  }

  var dragProxy = null;

  function startDrag(stack, loc, downEvent, sourceEl) {
    var startX = downEvent.clientX;
    var startY = downEvent.clientY;
    var rect = sourceEl.getBoundingClientRect();

    dragProxy = document.createElement("div");
    dragProxy.style.position = "fixed";
    dragProxy.style.left = rect.left + "px";
    dragProxy.style.top = rect.top + "px";
    dragProxy.style.pointerEvents = "none";
    dragProxy.style.zIndex = 9999;

    var offset = cardOffset();
    stack.forEach(function (card, i) {
      var el = makeCardEl(card);
      el.style.position = "absolute";
      el.style.left = "0px";
      el.style.top = (i * offset) + "px";
      dragProxy.appendChild(el);

      if (card.el) card.el.style.visibility = "hidden";
    });
    document.body.appendChild(dragProxy);

    function onMove(e) {
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      dragProxy.style.left = (rect.left + dx) + "px";
      dragProxy.style.top = (rect.top + dy) + "px";
    }

    function onUp(e) {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      dragProxy.style.display = "none";
      var dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      document.body.removeChild(dragProxy);
      dragProxy = null;

      var pileEl = dropTarget ? dropTarget.closest(".sol-pile") : null;
      handleDrop(stack, loc, pileEl);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  function handleDrop(stack, loc, pileEl) {
    if (!pileEl) { render(); return; }

    var bottomCard = stack[0];

    if (pileEl.classList.contains("sol-foundation")) {
      var foundationIndex = parseInt(pileEl.getAttribute("data-foundation"), 10);
      if (stack.length === 1 && canDropOnFoundation(bottomCard, foundationIndex)) {
        removeFromSource(loc, stack);
        state.foundations[foundationIndex].push(bottomCard);
      }
      render();
      return;
    }

    if (pileEl.hasAttribute("data-col")) {
      var col = parseInt(pileEl.getAttribute("data-col"), 10);
      if (loc.type === "tableau" && loc.col === col) { render(); return; }
      if (canDropOnTableau(bottomCard, col)) {
        removeFromSource(loc, stack);
        stack.forEach(function (c) { state.tableau[col].push(c); });
      }
      render();
      return;
    }

    render();
  }

  function checkWin() {
    var total = 0;
    state.foundations.forEach(function (pile) { total += pile.length; });
    document.getElementById("solWinMessage").hidden = total !== 52;
  }

  document.getElementById("solStock").addEventListener("click", function () {
    if (state.stock.length > 0) {
      var card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
    } else if (state.waste.length > 0) {
      while (state.waste.length > 0) {
        var c = state.waste.pop();
        c.faceUp = false;
        state.stock.push(c);
      }
    }
    render();
  });

  document.getElementById("solNewGame").addEventListener("click", newGame);

  newGame();
})();
