function fadeOut(el, duration) {
  var s = el.style, step = 25/(duration || 300);
  s.opacity = s.opacity || 1;
  (function fade() { (s.opacity -= step) < 0 ? s.display = "none" : setTimeout(fade, 25); })();
}

function fadeIn(el, duration, display) {
  var s = el.style, step = 25/(duration || 300);
  s.opacity = s.opacity || 0;
  s.display = display || "block";
  (function fade() { (s.opacity = parseFloat(s.opacity)+step) > 1 ? s.opacity = 1 : setTimeout(fade, 25); })();
}

window.onload = function() {
  newRound();
};

function animateMotion(a, b){
  function offset(el) {
    let rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }

  const x = offset(b).left - offset(a).left + 80;
  const y = offset(b).top - offset(a).top;

  a.style.transform = 'translate('+ x + 'px,'+ y + 'px)';
  // a.style.transform = 'rotate(1turn)';
}

const rules = document.querySelector('#rules');
const container = document.querySelector('#container');

document.querySelector('#start').addEventListener('click', () => {
  fadeOut(rules, 500);

  setTimeout(function(){
    newRound();
    fadeIn(container, 500);
  }, 1000);
});

let cardsInUse = [];
let computerCards, personCards;

function isPersonsCard(cardNumber){
  return personCards.includes(parseInt(cardNumber));
}

function dealCards(requestedCardQty){
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
  }
  function checkIfUnique(cardNumber){
    return (cardsInUse.find((element) => {return element === cardNumber}) === undefined)? true : false;
  }

  const pickedCards = [];

  while (pickedCards.length < requestedCardQty) {
    const cardNumber = getRandomIntInclusive(1, 100)
    if(checkIfUnique(cardNumber, cardsInUse)){
      cardsInUse.push(cardNumber);
      pickedCards.push(cardNumber);
    }
  };

  return pickedCards;
}

function drawCard(cardNumber){
  const newCard = document.createElement('div');
  newCard.classList.add('card');
  newCard.id = 'card-' + cardNumber; //(parseInt(document.querySelectorAll('.card').length) + 1);
  newCard.setAttribute('draggable', 'true');
  newCard.dataset.cardNumber = cardNumber;
  newCard.innerHTML = cardNumber;
  return newCard;
}

function showCards(){
  const rowOnTable = document.querySelectorAll('.row');
  for (let i = 0; i < rowOnTable.length; i++){
    dealCards(1).forEach(card => rowOnTable[i].appendChild(drawCard(card)));
  };

  personCards.forEach((card) => {
    document.querySelector('#hand').appendChild(drawCard(card)).addEventListener('dragstart', dragstart_handler);
  });
}

function getComputerCard(){
  let bestOption;
  const rows = Array.from(document.querySelectorAll('.row'));
  const rowWithLeastCards = rows.find((row) => {row.childElementCount === Math.min.apply(null, rows.map((row) => {return row.childElementCount;})); return row;})
  const lastCardInRowNumber = parseInt(rowWithLeastCards.lastChild.dataset.cardNumber);

  for (let i = 0, minDiff; i < computerCards.length; i++) {
    if(getSuitableRow(computerCards[i]) == null){
      bestOption = computerCards[i];
      break;
    }else {
      const diff = computerCards[i] - lastCardInRowNumber;
      if(diff < minDiff || minDiff == null) {
        bestOption = computerCards[i];
        minDiff = diff;
      }
    }
  }
  computerCards.splice(computerCards.indexOf(bestOption), 1);
  return bestOption;
}

function getSuitableRow(cardNr){
  const cardNumber = parseInt(cardNr);
  const rows = Array.from(document.querySelectorAll('.row'));
  const emptyRow = rows.find(row => {return row.firstChild == null});
  let suitableRow;

  if (emptyRow) {console.log('Tuščia eilutė yra');
    suitableRow = emptyRow;
  } else {
    console.log('tuščios eilutės nėra');
    const rowsWithLowerCards = rows.filter(row => {return row.lastChild.dataset.cardNumber < cardNumber;});
    const CardWithMinDiff = Math.max.apply(null, rowsWithLowerCards.map((row) => {return row.lastChild.dataset.cardNumber;}))
    suitableRow = rowsWithLowerCards.find(row => {return row.lastChild.dataset.cardNumber == CardWithMinDiff;});
  }

  return suitableRow;
}

function dragstart_handler(e){
  e.dataTransfer.setData("text/html", e.target.id);
  e.dataTransfer.dropEffect = "move";

  e.target.classList.add('my');
}

function dragover_handler(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  // e.target.style.opacity = '0.5';
}

function drop_handler(e){
  e.preventDefault();
  const data = e.dataTransfer.getData("text/html");

  document.getElementById(data).removeEventListener('dragstart', dragstart_handler);
  document.querySelector('#selected-cards').appendChild(document.getElementById(data));
  document.querySelector('#selected-cards').appendChild(drawCard(getComputerCard()));

  console.log('Mano korta:', document.querySelectorAll('#selected-cards .card')[0].dataset.cardNumber, 'Kompo korta:',  document.querySelectorAll('#selected-cards .card')[1].dataset.cardNumber);

  setTimeout(performAction, 1000);
}

function performAction(){
  const selectedCards = Array.from(document.querySelectorAll('#selected-cards .card')).sort((a, b) => {return parseInt(a.dataset.cardNumber) - parseInt(b.dataset.cardNumber)});
  console.log('Action, liko nepadėtų kortų', selectedCards);

  if (selectedCards[0]) {

    const card = selectedCards[0];
    const suitableRow = getSuitableRow(card.dataset.cardNumber);
    const rows = Array.from(document.querySelectorAll('.row'));

    if (suitableRow == null) {
      if (isPersonsCard(card.dataset.cardNumber)) {
        document.querySelectorAll('#hand .card').forEach((card) => {card.removeEventListener('dragstart', dragstart_handler)});
        rows.forEach(row => {
          row.classList.add('red');
          row.addEventListener('click', function selectRow(e){
            const row = e.currentTarget;
            takeCards(row, isPersonsCard(card.dataset.cardNumber));
            rows.forEach((row) => {
              row.classList.remove('red');
              row.removeEventListener('click', selectRow, true);
            });
            document.querySelectorAll('#hand .card').forEach((card) => {card.addEventListener('dragstart', dragstart_handler)});
          }, true);
        });
        return;
      } else {
        const rowWithLeastCards = Math.min.apply(null, rows.map((row) => {return row.childElementCount;}))
        const bestRowToTake = rows.find(row => {if(row.childElementCount == rowWithLeastCards){return row;}});
        takeCards(bestRowToTake, isPersonsCard(card.dataset.cardNumber));
        return;
      }
    } else if (suitableRow) {
      if (parseInt(suitableRow.childElementCount) == 5) {
        console.log('Ups! Tinkamoje eilutėje 5 kortos');
        takeCards(suitableRow, isPersonsCard(card.dataset.cardNumber));
        return;
      } else if (parseInt(suitableRow.childElementCount) < 5)  {
        animateMotion(card, suitableRow.lastChild || suitableRow);
        card.addEventListener('transitionend', (e) => {
          e.target.style.transform = 'none';
          suitableRow.appendChild(card);
          console.log('Dedu', card.dataset.cardNumber, ' į tinkamą eilutę: ', suitableRow);
          return performAction();
        });
      }
    }
  } else {
    checkGameStatus(); // ar tikrai reikia?
    console.log('Ėjimas baigtas');
    return;
  }
}

// function placeCard(card){
//   const suitableRow = getSuitableRow(card.dataset.cardNumber);
//   console.log('Tinkama eilute: ', suitableRow);
//   animateMotion(card, suitableRow.lastChild || suitableRow);
//   card.addEventListener('transitionend', (e) => {
//     e.target.style.transform = 'none';
//     if(parseInt(suitableRow.childElementCount) == 5){
//       takeCards(suitableRow, isPersonsCard(card.dataset.cardNumber));
//     }
//     suitableRow.appendChild(card);
//
//     if(document.querySelectorAll('#selected-cards .card').length > 0){performAction()};
//   });
// }
function takeCards(row, isPerson){
  const cards = row.querySelectorAll('.card');
  if (cards[0]) {
    if (isPerson) {
      animateMotion(cards[0], document.querySelector('#bad'));
      cards[0].addEventListener('transitionend', (e) => {
        e.target.style.transform = 'none';
        document.querySelector('#bad').appendChild(cards[0]);
        console.log('Žaidėjas pasiėmė', cards[0].dataset.cardNumber);
        return takeCards(row, isPerson);
      });
    } else {
      console.log('Kompas pasiėmė', cards[0].dataset.cardNumber);
      cards[0].remove();
      return takeCards(row, isPerson);
    }
    incrementPoints(isPerson);
  } else {
    console.log('Paėmimo ciklas baigtas');
    return performAction();
  }
  // for (let i = 0; i <= cards.length - 1; i++) {
  //   if (isPerson) {
  //     animateMotion(cards[i], document.querySelector('#bad'));
  //     cards[i].addEventListener('transitionend', (e) => {
  //       e.target.style.transform = 'none';
  //       document.querySelector('#bad').appendChild(cards[i]);
  //       console.log('Žaidėjas pasiėmė', cards[i].dataset.cardNumber);
  //     });
  //   } else {
  //     console.log('Kompas pasiėmė', cards[i].dataset.cardNumber);
  //     cards[i].remove();
  //   }
  //
  //   incrementPoints(isPerson);
  //   console.log('i:',i, 'cards length', cards.length);
  //   if(i == cards.length - 1){performAction();}
  // }
  // console.log('Paėmimo ciklas baigtas');
  // return;
  // if(isPersonsCard) {
  //   for (let i = 0; row.childElementCount > 1 && i < 5; i++) {
  //     let firstCardInRow = row.querySelectorAll('.card')[i];
  //     document.querySelector('#bad').appendChild(firstCardInRow);
  //     incrementPoints(isPersonsCard);
  //   };
  // } else {
  //   for (let i = 0; row.childElementCount > 1 && i < 5; i++) {
  //     let firstCardInRow = row.querySelectorAll('.card')[i];
  //     firstCardInRow.remove();
  //     incrementPoints(isPersonsCard);
  //   };
  // }
  // while (row.firstChild) {
  //   if(isPerson){
  //     animateMotion(row.firstChild, document.querySelector('#bad'));
  //     row.firstChild.addEventListener('transitionend', (e) => {
  //       e.target.style.transform = 'none';
  //       document.querySelector('#bad').appendChild(row.firstChild);
  //     });
  //   }else{
  //     row.firstChild.remove();
  //   }
  //   incrementPoints(isPerson);
  // }
}

function incrementPoints(isPerson) {
  const playerPoints = isPerson? document.querySelector('#person-points') : document.querySelector('#pc-points');
  playerPoints.textContent = parseInt(playerPoints.textContent)+1;
}

function isEnoughPoints(){
  const personPoints = parseInt(document.querySelector('#person-points').textContent);
  const pcPoints = parseInt(document.querySelector('#pc-points').textContent);

  if (personPoints >= 10 || pcPoints >= 10) {
    return true;
  }else {
    return false;
  }
}

document.querySelector('#selected-cards').addEventListener('dragover', dragover_handler);
document.querySelector('#selected-cards').addEventListener('drop', drop_handler);

function checkGameStatus() {
  if(document.querySelector('#hand').childElementCount == 0){
    document.querySelector('#container').style.opacity = 0.5;
    if (isEnoughPoints()) {

      const personPoints = parseInt(document.querySelector('#person-points').textContent);
      const computerPoints = parseInt(document.querySelector('#pc-points').textContent);
      const winner = (personPoints < computerPoints)? 'You won!' : 'Computer won! :(';
      const finalScore = computerPoints + ':' + personPoints;

      const message = `
      <h2>Game over!</h2>
      <p>Computer ${computerPoints} : Player ${personPoints}</p>
      <p>${winner}</p>
      `;

      showPopUp(message, 'Play again');
      document.querySelector('#person-points').textContent = 0;
      document.querySelector('#pc-points').textContent = 0;
      endRound();
    }else {
      const message = `
      <h2>Round over</h2>
      <p>Keep up!</p>
      `;
      showPopUp(message,'Next round');
      endRound();
    }
  }
}

function newRound() {
  computerCards = dealCards(10).sort((a, b) => {return a - b;});
  personCards = dealCards(10).sort((a, b) => {return a - b;});

  console.log(computerCards);
  showCards();
}

function resetTable() {
  while (document.querySelector('.card')) {
    document.querySelector('.card').remove();
  }

  cardsInUse.length = 0;
  computerCards.length = 0;
  personCards.length = 0;
}

function endRound() {
  document.querySelector('#popup button').addEventListener('click', () => {
    resetTable();
    newRound();
    document.querySelector('#popup').remove();
    document.querySelector('#container').style.opacity = 1;
  })
}

function showPopUp(message, btnText){
  const popUp = document.createElement('div');
  const btn = document.createElement('button');

  popUp.id = 'popup';

  popUp.innerHTML = message;

  btn.textContent = btnText;


  document.body.insertBefore(popUp, document.querySelector('#container'));
  popUp.appendChild(btn);

}
