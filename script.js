const cardsInUse = [];
const ComputerHandCards = dealCards(10).sort((a, b) => {return a - b;});

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

  const playerCards = dealCards(10).sort(function(a, b) {return a - b;});
  const inHand = document.getElementById('hand');
  playerCards.forEach(card => inHand.appendChild(drawCard(card)));
}

function dragstart_handler(e){
  e.dataTransfer.setData("text/html", e.target.id);
  e.dataTransfer.dropEffect = "move";
}

function dragover_handler(e) {
 e.preventDefault();
 e.dataTransfer.dropEffect = "move"
}

function drop_handler(e){
  e.preventDefault();
  const data = e.dataTransfer.getData("text/html");

  const selectedCard = document.getElementById(data).dataset.cardNumber; // nereikalingas
  const computerCard = drawCard(getComputerCard());

  console.log('Mano: ', selectedCard, 'Tinkama Eilutė: ', getSuitableRow(selectedCard));
  console.log('Kompo: ', computerCard.dataset.cardNumber, 'Tinkama Eilutė: ', getSuitableRow(computerCard.dataset.cardNumber));
  console.log('Kompui liko ', ComputerHandCards.length, 'kortos: ', ComputerHandCards);

  document.querySelector('#selected-cards .person').appendChild(document.getElementById(data));
  document.querySelector('#selected-cards .pc').appendChild(computerCard);

  performAction();
}

function performAction(){
  const selectedCards = Array.from(document.querySelectorAll('#selected-cards .card'))
       .sort((a, b) => {return a.dataset.cardNumber - b.dataset.cardNumber});

  for(i = 0; i < selectedCards.length; i++){
    const player = selectedCards[i].parentNode.classList[0];
    if(getSuitableRow(selectedCards[i].dataset.cardNumber) == null){
      chooseRowToTake(selectedCards[i], player);
      break;
    }else {
      placeCard(selectedCards[i], player);
    }
  }
}

function getComputerCard(){
  // įvertinti kortų kiekį eilutuje, kad nedėtu kortos nors ir su mažiausiu skirtumu ten kur daug kortų
  let bestOption;
  const rows = Array.from(document.querySelectorAll('.row'));
  // const rowWithLeastCards = Math.min.apply(null, rows.map((row) => {return row.childElementCount;}));
  const rowWithLeastCards = rows.find((row) => {row.childElementCount === Math.min.apply(null, rows.map((row) => {return row.childElementCount;})); return row;})

  const lastCardInRowNumber = parseInt(rowWithLeastCards.lastChild.dataset.cardNumber);

  for (let i = 0, minDiff; i < ComputerHandCards.length; i++) {
    if(getSuitableRow(ComputerHandCards[i]) == null){
      bestOption = ComputerHandCards[i];
      break;
    }else {

      // const lastCardsNumber = parseInt(getSuitableRow(ComputerHandCards[i]).lastChild.dataset.cardNumber);
      const diff = ComputerHandCards[i] - lastCardInRowNumber;
        if(diff < minDiff || minDiff == null) {
          bestOption = ComputerHandCards[i];
          minDiff = diff;
        }
    }
  }
  // for (let i = 0, minDiff; i < ComputerHandCards.length; i++) {
  //   if(getSuitableRow(ComputerHandCards[i]) == null){
  //     bestOption = ComputerHandCards[i];
  //     break;
  //   }else {
  //
  //     const lastCardsNumber = parseInt(getSuitableRow(ComputerHandCards[i]).lastChild.dataset.cardNumber);
  //
  //
  //
  //
  //     const diff = ComputerHandCards[i] - lastCardsNumber;
  //       if(diff < minDiff || minDiff == null) {
  //         bestOption = ComputerHandCards[i];
  //         minDiff = diff;
  //       }
  //   }
  // }
  ComputerHandCards.splice(ComputerHandCards.indexOf(bestOption), 1);
  return bestOption;
}

function placeCard(card, player){
  const suitableRow = getSuitableRow(card.dataset.cardNumber);

  suitableRow.appendChild(card);
  if(parseInt(suitableRow.childElementCount) > 5){
    takeCards(suitableRow, player);
  }
}

function chooseRowToTake(card, player){
  const rows = Array.from(document.querySelectorAll('.row'));

  if (player == 'pc') {
    const rowWithLeastCards = Math.min.apply(null, rows.map((row) => {return row.childElementCount;}))
    const bestRowToTake = rows.find(row => {if(row.childElementCount == rowWithLeastCards){return row;}});
    bestRowToTake.appendChild(card);
    takeCards(bestRowToTake, player);

    performAction();


  }else {
    function selectRow(e){
      const row = e.target;
      row.appendChild(card);
      takeCards(row, player);

      rows.forEach(row => {
        row.classList.remove('red');
        row.removeEventListener('click', selectRow);

        performAction();

      });
    }
    rows.forEach(row => {
      row.classList.add('red');
      row.addEventListener('click', selectRow);
    });
  }

}

function getSuitableRow(cardNr){
  const cardNumber = parseInt(cardNr);
  const rows = Array.from(document.querySelectorAll('.row'));
  const rowsWithLowerCards = rows.filter(row => row.lastChild.dataset.cardNumber < cardNumber);
  const CardWithMinDiff = Math.max.apply(null, rowsWithLowerCards.map((row) => {return row.lastChild.dataset.cardNumber;}))
  const suitableRow = rowsWithLowerCards.find(row => {return row.lastChild.dataset.cardNumber == CardWithMinDiff});
  return suitableRow;
}

function takeCards(row, player){
  const placeToPut = (player == 'person')? document.querySelector('#bad'):document.querySelector('#pc-bad');

  for (let i = 0; row.childElementCount > 1 && i < 5; i++) {
    const firstCardInRowID = document.getElementById(row.querySelectorAll('.card')[0].id);
    placeToPut.appendChild(firstCardInRowID);
  };
}

showCards();
console.log(ComputerHandCards);
document.querySelectorAll('.card').forEach((card) => {card.addEventListener('dragstart', dragstart_handler)});
document.querySelector('#selected-cards .person').addEventListener('dragover', dragover_handler);
document.querySelector('#selected-cards .person').addEventListener('drop', drop_handler);
