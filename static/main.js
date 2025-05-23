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

function loginButton() {
    const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = '/login';
    });
  }
}

function sideBarLog() {
  const acc = document.getElementById('userAcc-btn');
  const pfOverlay = document.getElementById('profile-overlay');
  const pfClose = pfOverlay.querySelector('.close-portal');
  const logout = document.getElementById('logout-btn');

  if (pfOverlay&& acc) {
    acc.addEventListener('click', () => {
      pfOverlay.style.display = 'flex';
    });
  }

  if (pfClose) {
    pfClose.addEventListener('click', () => {
      pfOverlay.style.display = 'none';
    });
  }

  if (logout) {
    logout.addEventListener('click', () => {
      window.location.href = '/logout';
    });
  }
}

async function injectArticle(articleTitle, articleAuthor, articleDate, articleAbstract, articleImage, articleImageCaption) {
  // This function article title, author, date, abstract, image and image caption and injects them into the HTML page.
  // It creates a new section for each article and appends it to a div with class name "gridContainer" inside main.

  const articleContainer = document.querySelector('main div.gridContainer');
  const comments = await loadComments(articleTitle);
  const totalComments = commentsLengthDFS(comments);

  const articleHTML = `
    ${articleImage !== '' ? `<img src="${articleImage}" alt="${articleImageCaption}" class="news-image">` : ''}
    <h2>${articleTitle}</h2>
    <p>${articleAbstract}</p>
    <button class="comment-button"><img src="/static/assets/comment.svg" alt="comment"><text id='comments-number'>${totalComments}</text></button>
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
  loginButton();
  sideBarLog();
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

// click event listner for the comment button
// Opens up a portal on the right
addEventListener('click', async (e) => {
  if (e.target.classList.contains('comment-button') || e.target.closest('.comment-button')) {
    const articleSection = e.target.closest('section');
    const articleTitle = articleSection.querySelector('h2').textContent;

    // Check if portal already exists
    if (document.querySelector('.comment-portal-overlay')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.classList.add('comment-portal-overlay');

    // Create portal
    const portal = document.createElement('div');
    portal.classList.add('comment-portal');

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('close-portal');
    const closeImg = document.createElement('img');
    closeImg.src = '/static/assets/bar.svg';
    closeImg.alt = 'bar';
    closeBtn.appendChild(closeImg);
    closeBtn.onclick = () => overlay.remove();
    portal.appendChild(closeBtn);

    // Portal Review Title
    const reviewTitle = document.createElement('h2');
    reviewTitle.textContent = `'Sacramento' Review: ${articleTitle}`;
    reviewTitle.classList.add('review-title');
    portal.appendChild(reviewTitle);
    portal.appendChild(document.createElement('hr'));

    const commentDiv = await commentsSection(articleTitle);
    portal.appendChild(commentDiv);

    overlay.appendChild(portal);
    document.body.appendChild(overlay);

    // Prevent clicks on overlay from closing portal (except on close button)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
});

/**
 * Function to call to server to load comments for a specific article
 * @param {string} articleTitle - The title of the article to grab comments for.
 * @returns {json} - Returns the comments in JSON format.
 */
async function loadComments(articleTitle) {
  if (typeof fetch !== 'function') {
    return [];
  }
  try {
    const response = await fetch(`/api/comments/${encodeURIComponent(articleTitle)}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

/**
 * Posts a comment to an article
 * @param {string} articleTitle - The title of the article to comment on.
 * @param {string} text - The reply text.
 * @returns {void} Returns nothing.
 */
async function postComment(articleTitle, text) {

  try {
    const response = await fetch(`/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ articleTitle, text }),
    });

    if (!response.ok) {
      console.log("Post Response not ok");
      const errorData = await response.text();
      throw new Error(errorData.error || 'Failed to post comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting comment:', error);
    throw error;
  }
}

/**
 * Posts a reply to a specific comment.
 * @param {string|number} commentId - The ID of the comment to reply to.
 * @param {string} text - The reply text.
 * @returns {Promise<Object>} The posted reply object.
 */
async function postReply(commentId, text) {
  try {
    const response = await fetch(`api/comments/${encodeURIComponent(commentId)}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to post reply');
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting reply:', error);
    throw error;
  }
}

/**
 * Grabs all the comments associated with the article title from db
 * @param {string} articleTitle - name of the article
 * @returns {HTMLDivElement} an element containing the comments section
 */
async function commentsSection(articleTitle) {
  // This function creates a comment section for the article and injects it into the portal.
  const commentSection = document.createElement('div');
  commentSection.classList.add('comment-section');

  let comments = await loadComments(articleTitle);
  const header = document.createElement('h2');
  header.innerHTML = `<strong>Comments</strong> ${commentsLengthDFS(comments)}`;
  commentSection.appendChild(header);

  if (window.USER) {
    const commentInput = document.createElement('textarea');
    commentInput.placeholder = 'Share your thoughts.';
    commentSection.appendChild(commentInput);

    // Create a container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'none'; // Hidden by default
    buttonContainer.style.marginLeft = 'auto';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
      commentInput.value = '';
      buttonContainer.style.display = 'none';
    };

    buttonContainer.append(cancelButton, submitButton);
    commentSection.appendChild(buttonContainer);

    // Show buttons only when user is typing
    commentInput.addEventListener('input', () => {

      buttonContainer.style.display = commentInput.value.trim() ? 'block' : 'none';
      
    });

    // submit handler
    submitButton.addEventListener('click', async () => {
      const commentText = commentInput.value.trim();
      if (!commentText) return;
      try {
        // Post the comment to the server
        const newComment = await postComment(articleTitle, commentText);
        comments.push(newComment);
        // update header count & re-render commentList
        header.innerHTML = `<strong>Comments</strong> ${commentsLengthDFS(comments)}`;
        renderComments();
        commentInput.value = '';
        buttonContainer.style.display = 'none';
      } catch (error) { 
        console.error('Error posting comment:', error);
      }
    });
  } else {
    const loginPrompt = document.createElement('p');
    loginPrompt.innerHTML = `Please <a href="/login">log in</a> to comment.`;
    commentSection.appendChild(loginPrompt);
  }
  const listComment = document.createElement('div');
  commentSection.appendChild(listComment);

  function renderComments() {
    listComment.innerHTML = '';
    listComment.append(showComments(comments));
  }
  listComment._data = comments;
  currComm = [ articleTitle, listComment ];
  renderComments();

  return commentSection;
}

/**
 * Recursively counts the total number of comments and replies
 * @param {Array} comments - Array of comment objects with potential nested replies
 * @returns {number} Total count of comments and all nested replies
 */
function commentsLengthDFS(comments) {
  let count = Number(0);
  comments.forEach(comment => {
    count++;
    if (comment.replies.length) {
      count += commentsLengthDFS(comment["replies"]);
    }
  });
  return count;
}

/**
 * Creates a reply button and textarea for replying to comments
 * @param {HTMLElement} listComm - An element representing the comment to which the reply is being made
 * @param {string} parentId - The ID of the comment being replied to
 * @param {Object} commentObj - The comment object being replied to
 * @returns {void} Returns nothing
 */
function createReplyBtn(listComm, parentId, commentObj) {
  if (listComm.querySelector('.reply-box')) return;

  const replyBtn   = document.createElement('div');
  replyBtn.className = 'reply-box';

  const replyQueryDiv = document.createElement('div');
  replyQueryDiv.className = 'reply-query-div';

  const ta    = document.createElement('textarea');
  ta.placeholder = 'Reply…';

  const sendReply = document.createElement('button');
  sendReply.textContent = 'Send';
  sendReply.className   = 'reply-send-btn';

  const canReply = document.createElement('button');
  canReply.textContent = 'Cancel';
  canReply.className   = 'reply-cancel-btn';

  canReply.onclick = () => replyBtn.remove();

  sendReply.onclick = async () => {
    const text = ta.value.trim();
    if (!text) return;

    try {
      const newReply = await postReply(parentId, text);
      commentObj.replies.push(newReply);

      const [, list] = currComm;
      list.innerHTML = '';
      list.append(showComments(list._data));
    } catch (err) { console.error(err); }
  };

  replyQueryDiv.append(sendReply, canReply);
  replyBtn.append(ta, replyQueryDiv);

  // Insert right below the reply button
  const replyButton = listComm.querySelector('.reply-button');
  listComm.insertBefore(replyBtn, listComm.querySelector('.interaction-div').nextSibling);
}

/**
 * Takes in a list of comments and creates a nested list of comments and replies
 * @param {json} comments - json object of comments and their replies
 * @returns {HTMLElement} - Returns a list of comments and replies in HTML format
 */
function showComments(comments) {
  // This function takes the comments and creates a list of comments and replies.

  const commentList = document.createElement('ul');
  commentList.classList.add('comment-list');


  comments.forEach(comment => {
    const replyList = document.createElement('li');

    // Create user logo
    const userLogo = document.createElement('span');
    userLogo.textContent = comment.username[0].toUpperCase();
    userLogo.classList.add('user-logo');

    // Username in bold
    const userName = document.createElement('span');
    userName.textContent = comment.username;
    userName.style.fontWeight = 'bold';

    // User info container
    const userInfo = document.createElement('div');
    userInfo.style.display = 'flex';
    userInfo.style.alignItems = 'center';
    userInfo.append(userLogo, userName);

    // Comment text in a paragraph
    const commentText = document.createElement('p');
    commentText.textContent = comment.text;

    replyList.append(userInfo, commentText);

    const interactionDiv = document.createElement('div');
    interactionDiv.className = 'interaction-div';

    if (window.USER) {
      const replyBtn = document.createElement('button');
      replyBtn.textContent = 'Reply';
      replyBtn.className = 'reply-button';
      replyBtn.onclick = () => createReplyBtn(replyList, comment._id, comment);
      interactionDiv.append(replyBtn);
    }

    if (window.USER && (window.USER.name === 'moderator' || window.USER.name === "admin")) {

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className   = 'MOD-delete';
      deleteBtn.onclick = async () => {
        try {
          const response = await fetch(`/api/comments/${comment._id}`, { method: 'DELETE' });
          if (!response.ok){
            throw new Error('delete failed');
          }

          comment.text = `COMMENT REMOVED BY ${window.USER.name.toUpperCase()}!`;
          comment.replies = [];
          const portal = document.querySelector('.comment-portal');

          if (!currComm||!portal) return;

          const [ articleTitle, listComment ] = currComm;
          listComment.innerHTML = '';

          listComment.append(showComments(listComment._data));
        } catch (error) {
          console.error('Error Deleting Comment:', error);
        }
      };
      interactionDiv.append(deleteBtn);
    }

    replyList.append(interactionDiv);

    // nested replies
    if (comment.replies?.length) {
      replyList.append(showComments(comment.replies));
    }

    commentList.append(replyList);
  });

  return commentList;
}

// If the footer is visible we will load more articles
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
  module.exports = {
    getDateAndTime, responseStatusCheck, lazyLoadArticles, articleParser, 
    showComments, postComment, loadComments, postReply, commentsSection, 
    currPg, pgSize, isLoading};
  
}