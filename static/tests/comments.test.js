// Author: Mohammad Ayub Hanif Saleh
//         Raiyan Sazid

const { showComments, postComment, loadComments, postReply, commentsSection } = require('../main.js');


describe('showComments()', () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="test-container"></div>`;
        window.USER = null;
    });

    test('Should render two comments', () => {
        const comments = [
        { articleTitle: "Raiyan's Article", text: "I like rabbit", user: "Not Raiyan", username: "NR", replies: [], },
        { articleTitle: "Raiyan's Article", text: "I like rabbit foot", user: "Also Not Raiyan", username: "ANR", replies: [], },
        ];
    
        let commentsElements = showComments(comments);

        // Add to DOM for querying
        document.getElementById('test-container').appendChild(commentsElements);
    
        expect(commentsElements.classList.contains('comment-list')).toBe(true);

        const userLogos = document.querySelectorAll('.user-logo');
        expect(userLogos.length).toBe(2); // should have 2 user logos
    });
    test('Should show no comments if there are none', () => {
        const comments = [];
    
        showComments(comments);
    
        const commentElements = document.querySelectorAll('.comment');
        expect(commentElements.length).toBe(0);
    });

    test('Should show comments with repliues', () => {
        const comments = [
            { articleTitle: "Raiyan's Article", text: "I like rabbit", user: "Not Raiyan", username: "NR", replies: [], },
            { articleTitle: "Raiyan's Article", text: "I like rabbit foot", user: "Also Not Raiyan", username: "ANR", replies: [
                { articleTitle: "Raiyan's Article", text: "I like rabbit foot too", user: "Also Not Not Raiyan", username: "ANNR", replies: [], },
                { articleTitle: "Raiyan's Article", text: "I like rabbit foot too too", user: "Definitely Raiyan", username: "DR", replies: [], },
            ], },
        ];

        let commentsElements = showComments(comments);
        // Add to DOM for querying
        document.getElementById('test-container').appendChild(commentsElements);
        expect(commentsElements.classList.contains('comment-list')).toBe(true);
        const userLogos = document.querySelectorAll('.user-logo');
        expect(userLogos.length).toBe(4); // should have 4 user logos
    });
});
    