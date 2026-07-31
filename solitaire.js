(function () {
  "use strict";

  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var RED_SUITS = { H: true, D: true };
  var RANK_LABEL = { 1: "A", 11: "J", 12: "Q", 13: "K" };

  var state = null;

  function rankLabel(r) {
    return RANK_LABEL[r] || String(r);
  }

  function isRed(suit) {
    return !!RED_SUITS[suit];
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
      foundations: { S: [], H: [], D: [], C: [] },
      tableau: tableau
    };

    document.getElementById("solWinMessage").hidden = true;
    render();
  }

  function makeCardEl(card) {
    var el = document.createElement("div");
    el.className = "sol-card " + (card.faceUp ? (isRed(card.suit) ? "red" : "black") : "face-down");
    if (card.faceUp) {
      var corner = document.createElement("div");
      corner.className = "sol-card-corner";
      corner.textContent = rankLabel(card.rank) + " " + SUIT_SYMBOL[card.suit];
      el.appendChild(corner);

      var big = document.createElement("div");
      big.className = "sol-card-suit-big";
      big.textContent = SUIT_SYMBOL[card.suit];
      el.appendChild(big);
    }
    return el;
  }

  function render() {
    renderSimplePile("solStock", state.stock.length ? [state.stock[state.stock.length - 1]] : [], false);
    renderSimplePile("solWaste", state.waste.length ? [state.waste[state.waste.length - 1]] : [], false);

    SUITS.forEach(function (suit) {
      var pile = state.foundations[suit];
      renderSimplePile("foundation-" + suit, pile.length ? [pile[pile.length - 1]] : [], false);
    });

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
    cards.forEach(function (card, idx) {
      var el = makeCardEl(card);
      el.style.left = "0px";
      el.style.top = (idx * 22) + "px";
      attachHandlers(el, card);
      container.appendChild(el);
    });
  }

  function locatePile(card) {
    if (state.waste.indexOf(card) !== -1) return { type: "waste", pile: state.waste };
    for (var s in state.foundations) {
      if (state.foundations[s].indexOf(card) !== -1) return { type: "foundation", suit: s, pile: state.foundations[s] };
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

  function canDropOnFoundation(card, suit) {
    var pile = state.foundations[suit];
    if (card.suit !== suit) return false;
    if (pile.length === 0) return card.rank === 1;
    return pile[pile.length - 1].rank === card.rank - 1;
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
    var suit = card.suit;
    if (canDropOnFoundation(card, suit)) {
      removeFromSource(loc, stack);
      state.foundations[suit].push(card);
      render();
      return true;
    }
    return false;
  }

  function attachHandlers(el, card) {
    el.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      tryAutoToFoundation(card);
    });

    el.addEventListener("mousedown", function (e) {
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

    stack.forEach(function (card, i) {
      var el = makeCardEl(card);
      el.style.position = "absolute";
      el.style.left = "0px";
      el.style.top = (i * 22) + "px";
      dragProxy.appendChild(el);
    });
    document.body.appendChild(dragProxy);

    function onMove(e) {
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      dragProxy.style.left = (rect.left + dx) + "px";
      dragProxy.style.top = (rect.top + dy) + "px";
    }

    function onUp(e) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      dragProxy.style.display = "none";
      var dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      document.body.removeChild(dragProxy);
      dragProxy = null;

      var pileEl = dropTarget ? dropTarget.closest(".sol-pile") : null;
      handleDrop(stack, loc, pileEl);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleDrop(stack, loc, pileEl) {
    if (!pileEl) { render(); return; }

    var bottomCard = stack[0];

    if (pileEl.classList.contains("sol-foundation")) {
      var suit = pileEl.getAttribute("data-suit");
      if (stack.length === 1 && canDropOnFoundation(bottomCard, suit)) {
        removeFromSource(loc, stack);
        state.foundations[suit].push(bottomCard);
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
    SUITS.forEach(function (s) { total += state.foundations[s].length; });
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
