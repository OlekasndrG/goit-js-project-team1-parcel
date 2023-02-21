import { getAuth } from 'firebase/auth';
import { load, save } from './js/common/local_storage';
import { onGetCookie } from './js/components/dataBase/getCookie';
import { getDatabase, ref, child, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyCAzOEobkX7zjzKcWCZNu8dhUnsurUUSAw',
  authDomain: 'news-goit-1.firebaseapp.com',
  databaseURL:
    'https://news-goit-1-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'news-goit-1',
  storageBucket: 'news-goit-1.appspot.com',
  messagingSenderId: '618434101899',
  appId: '1:618434101899:web:58e5277fd4ec3d55f6ca8e',
  measurementId: 'G-7YDFYWJH4S',
};

const app = initializeApp(firebaseConfig);

const refs = {
  readPage: document.querySelector('.read-page-gallery'),
  emptyPage: document.querySelector('.empty-page'),
};

if (onGetCookie('user')) {
  const auth = getAuth(app);
  const userId = onGetCookie('user');
  renderCardsDatabase(userId);
} else {
  if (load('readCards')) {
    renderCards(load('readCards'));
  }
  findFavoriteCards();

  isEmptyPage();
}

refs.readPage.addEventListener('click', handleClickGallery);

function handleClickGallery(e) {
  e.preventDefault();
  const targetElement = e.target;
  const favoritesLocal = load('favCards') || [];

  if (targetElement.nodeName === 'P') {
    const card = targetElement.closest('.list-news__item');
    const cardBtn = card.querySelector('.item-news__add-text');
    const cardTitle = card.querySelector('.item-news__title');
    const cardHeartImg = card.querySelector('.item-news__heart-icon');
    cardHeartImg.classList.add('is-saved');
    cardBtn.textContent = 'Remove from favorite';
    const stringifyCard = card.outerHTML;

    const indexArray = favoritesLocal.map(el => el.title);
    const index = indexArray.indexOf(cardTitle.textContent);

    if (!cardTitle) return;

    if (index == -1) {
      favoritesLocal.push({
        card: stringifyCard,
        title: cardTitle.textContent,
      });
    } else {
      favoritesLocal.splice(index, 1);
      cardBtn.textContent = 'Add to favorite';
      cardHeartImg.classList.remove('is-saved');
    }

    save('favCards', favoritesLocal);
  }
}

function renderCards(array) {
  const newsCardArray = cardsByDate(array);
  renderCardsTemplate(newsCardArray);
}

function renderCardsTemplate(array) {
  const datesArray = Object.keys(array);
  const accordionGallery = makeAccordionGalleryMarkup();

  for (let date of datesArray) {
    const news = array[date];
    const parsedDatesToString = new Date(date).toLocaleDateString('en-GB');

    const accordion = makeAccordionMarkup();
    const title = makeTitleMarkup(parsedDatesToString);
    const arrow = makeArrowMarkUp();
    const content = makeContentMarkup();

    title.append(arrow);
    content.insertAdjacentHTML('beforeend', news.join(''));

    const cardBtn = content.querySelector('.item-news__add-text');
    const cardHeartImg = content.querySelector('.item-news__heart-icon');

    cardBtn.textContent = 'Add to favorite';
    cardHeartImg.classList.remove('is-saved');

    accordion.appendChild(title);
    accordion.appendChild(content);
    accordionGallery.appendChild(accordion);

    const titleArrayRef = accordion.querySelectorAll('.accordion__title');
    ListenAllTitleClick(titleArrayRef);

    const cardStatusRef = content.querySelectorAll('.item-news__already-read');
    changeCardStatus(cardStatusRef);
  }
  refs.readPage.appendChild(accordionGallery);
}

function renderCardsDatabase(userId) {
  const dbRef = ref(getDatabase());
  get(child(dbRef, `users/${userId}/readCards`))
    .then(snapshot => {
      if (snapshot.exists()) {
        const cardsObject = snapshot.val();
        const cardsArray = Object.values(cardsObject).flat();
        renderCards(cardsArray);
      } else {
        console.log('No data available');
      }
    })
    .catch(error => {
      console.error(error);
    });
}

function cardsByDate(array) {
  const decrSortedDates = array.sort(
    (a, b) => new Date(b.watchDate) - new Date(a.watchDate)
  );

  return decrSortedDates.reduce((acc, card) => {
    const { card: newsCard } = card;
    const date = new Date(card.watchDate).toLocaleDateString({
      year: 'numeric',
      day: 'numeric',
      month: 'numeric',
    });

    if (acc[date]) {
      acc[date].push(newsCard);
    } else {
      acc[date] = [newsCard];
    }

    return acc;
  }, {});
}

function isEmptyPage() {
  const content = document.querySelector('.accordion__content');

  if (!content) {
    console.log('yes');
    refs.emptyPage.classList.add('is-show');
  }
}

function makeAccordionGalleryMarkup() {
  const accordionGallery = document.createElement('div');
  accordionGallery.classList.add('accordion__by-date');
  return accordionGallery;
}

function makeAccordionMarkup() {
  const accordion = document.createElement('div');
  accordion.classList.add('accordion');
  return accordion;
}

function makeTitleMarkup(textContent) {
  const title = document.createElement('h2');
  title.classList.add('accordion__title');
  title.textContent = textContent;
  return title;
}

function makeArrowMarkUp() {
  const arrow = document.createElement('div');
  arrow.classList.add('accordion__arrow');
  arrow.classList.add('accordion__arrow--up');
  return arrow;
}

function makeContentMarkup() {
  const content = document.createElement('ul');
  content.classList.add('accordion__content');
  content.classList.add('container');
  return content;
}

function ListenAllTitleClick(refArray) {
  refArray.forEach(title =>
    title.addEventListener('click', onAccordionTitleClick)
  );
}

function changeCardStatus(array) {
  array.forEach(status => (status.textContent = 'Have read'));
}

function onAccordionTitleClick(e) {
  const arrowRef = e.target.querySelector('.accordion__arrow');
  const contentRef = e.target.nextSibling;

  if (arrowRef.classList.contains('accordion__arrow--up')) {
    arrowRef.classList.replace(
      'accordion__arrow--up',
      'accordion__arrow--down'
    );
    contentRef.classList.add('is-active');
  } else {
    arrowRef.classList.replace(
      'accordion__arrow--down',
      'accordion__arrow--up'
    );
    contentRef.classList.remove('is-active');
  }
}

function findFavoriteCards() {
  if (load('favCards')) {
    const cardsArray = load('favCards');
    const arrayHomePageCards = Array.from(
      refs.readPage.querySelectorAll('.item-news__article')
    );

    arrayHomePageCards.forEach(card => {
      const cardBtn = card.querySelector('.item-news__add-text');
      const cardHeartImg = card.querySelector('.item-news__heart-icon');
      const cardTitle = card.querySelector('.item-news__title');
      cardsArray.forEach(({ title }) => {
        if (title === cardTitle.textContent) {
          cardBtn.textContent = 'Remove from favorite';
          cardHeartImg.classList.add('is-saved');
        }
      });
    });
  }
}
