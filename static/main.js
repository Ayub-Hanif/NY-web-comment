// Author: Mohammad Ayub Hanif Saleh
//         Raiyan Sazid

// This function gets the current date in a specific format, and inject the date into the HTML page.
// The time options is to get weekday name, year, month, and day in correct format so it will appear on website navbar.
function getDateAndTime() {
  dateElement = document.querySelector('#date');
  const date = new Date();
  const time = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  dateElement.textContent = date.toLocaleDateString('en-US', time);
}

async function responseStatusCheck(response) {
  // This function returns Json object of the response if the response is ok.
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}
async function articleParser(data) {
  // This function takes NYT API's json data and parses articles from response docs
  // Then injects the articles into the HTML page using injectArticle function.

  articles = data.response.docs;
  for (let i = 0; i < articles.length; i++) {
    let articleTitle = articles[i].headline.main;
    let articleAuthor = articles[i].byline.original;
    let articleDate = articles[i].pub_date;
    let articleAbstract = articles[i].abstract;

    let articleImage = '';
    let articleImageCaption = '';

    if (articles[i].multimedia && articles[i].multimedia.default && articles[i].multimedia.default.url) {
      articleImage = articles[i].multimedia.default.url;
      articleImageCaption = articles[i].multimedia.caption;
    }
    
    await injectArticle(articleTitle, articleAuthor, articleDate, articleAbstract, articleImage, articleImageCaption);
  }
  return true;
}

async function injectArticle(articleTitle, articleAuthor, articleDate, articleAbstract, articleImage, articleImageCaption) {
  // This function article title, author, date, abstract, image and image caption and injects them into the HTML page.
  // It creates a new section for each article and appends it to a div with class name "gridContainer" inside main.

  const articleContainer = document.querySelector('main div.gridContainer');

  const articleHTML = `
    ${articleImage !== '' ? `<img src="${articleImage}" alt="${articleImageCaption}" class="news-image">` : ''}
    <h2>${articleTitle}</h2>
    <p>${articleAbstract}</p>
  `;

  // Inject a section named article and add the articleHTML
  const articleSection = document.createElement('section');
  articleSection.classList.add('article');
  articleSection.innerHTML = articleHTML;

  // Append the article section to the article container
  articleContainer.appendChild(articleSection);
}

// Added this listener so it also loads the date and calls the lazyloadArticles function
// I have added a footer options so if the user scrolls down and see the footer it will dynamically load more articles.
addEventListener('DOMContentLoaded', () => {
  getDateAndTime();
  lazyLoadArticles();

  //learned using youtube video to implement this. channel ("Steve Griffith").
  let options = {
    root: null,
    // no space to be addded.
    rootMargin: '0px',
    //making it so only 1% of the footer is visible before it loads more articles
    threshold: 0.01
  };
  const checker = new IntersectionObserver(lazyData, options);
  checker.observe(document.querySelector("footer"));
});

function lazyData(entries) {
    if (entries[0].isIntersecting) {
      lazyLoadArticles();
    }
}

let currPg = 0;
const pgSize    = 9; 
let isLoading    = false;

// This will load articles with scroll down and also it gives the date, current page and page size to fetch the articles.
// we hit the flask route on line 113 and then it does back end stuff and returns the articles.
async function lazyLoadArticles() {
  date = new Date();
  date = date.toISOString().split('T')[0].replace(/-/g, '');
  
  if (!isLoading) {
    isLoading = true;
    try {
      const myUrl = `api/findArticle/Sacramento-Davis/${date}?page=${currPg}&pageSize=${pgSize}`;
      const response = await fetch(myUrl)
      const data = await responseStatusCheck(response);
      if(data.response.docs.length) {
        // when we get articles we will parse them and push them into the HTML page.
        await articleParser(data);
        //simple increment so we will get next page of articles once we scroll.
        currPg++;
      }
      else{
        // If we see no more articles to load we just stop return.
        checker.disconnect();
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error, 'page=', currPg, 'pageSize=', pgSize);
    }
    finally {
      isLoading = false;
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = {getDateAndTime, responseStatusCheck, lazyLoadArticles, articleParser, currPg, pgSize, isLoading};
}