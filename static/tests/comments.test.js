// Author: Mohammad Ayub Hanif Saleh
//         Raiyan Sazid

const { showComments, commentsSection } = require('../main.js');


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
    

describe('commentsSection()', () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="test-container"></div>`;
        window.currComm = null;
        
        // Mock loadComments
        global.loadComments = jest.fn().mockResolvedValue([
            { articleTitle: "Raiyan's Article", text: "I like rabbit", user: "Not Raiyan", username: "NR", replies: [], },
            { articleTitle: "Raiyan's Article", text: "I like rabbit foot", user: "Also Not Raiyan", username: "ANR", replies: [
                { articleTitle: "Raiyan's Article", text: "I like rabbit foot too", user: "Also Not Not Raiyan", username: "ANNR", replies: [], },
                { articleTitle: "Raiyan's Article", text: "I like rabbit foot too too", user: "Definitely Raiyan", username: "DR", replies: [], },
            ], },
        ]);
        
        // Mock postComment
        global.postComment = jest.fn().mockResolvedValue(
            { articleTitle: "Raiyan's Article", text: "I HATE rabbits foot", user: "Loves Raiyan", username: "LR", replies: [], }
        );
    });
    
    test('Should show login prompt when not logged in', async () => {
        window.USER = null;
        
        const section = await commentsSection("Raiyan's Article");
        document.getElementById('test-container').appendChild(section);
        
        const loginPrompt = document.querySelector('p');
        expect(loginPrompt).not.toBeNull();
        expect(loginPrompt.innerHTML).toContain('Please <a href="/login">log in</a> to comment');
    });
    
    test('Should show comment input when logged in', async () => {
        window.USER = { name: 'testuser' };
        
        const section = await commentsSection("Raiyan's Article");
        document.getElementById('test-container').appendChild(section);
        
        const textarea = document.querySelector('textarea');
        expect(textarea).not.toBeNull();
        expect(textarea.placeholder).toContain('Share your thoughts');
    });
});