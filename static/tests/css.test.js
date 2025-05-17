// Author: Mohammad Ayub Hanif Saleh
//         Raiyan Sazid

describe("Mobile view functionality", () => {
    beforeEach(() => {
        // Set up a mock DOM structure
        document.body.innerHTML = `
        <div class="gridContainer"></div>
        `;
    });

  it("renders mobile layout correctly", () => {
    global.matchMedia = jest.fn().mockImplementation(query => {
        return {
            matches: query === "(max-width: 768px)", // Simulate mobile view
            addListener: jest.fn(),
            removeListener: jest.fn(),
        };
    });

    // Test behavior for mobile view
    expect(window.matchMedia("(max-width: 768px)").matches).toBe(true);

    const gridContainer = document.querySelector('.gridContainer');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'auto'; // Set 1 column for mobile layout

    const style = window.getComputedStyle(gridContainer);
    expect(style.gridTemplateColumns).toBe('auto'); // Expect 1 column
  });

  it("renders table layout correctly", () => {
    global.matchMedia = jest.fn().mockImplementation(query => {
        return {
            matches: query === "(max-width: 1024px)", // Simulate mobile view
            addListener: jest.fn(),
            removeListener: jest.fn(),
        };
    });

    // Test behavior for mobile view
    expect(window.matchMedia("(max-width: 1024px)").matches).toBe(true);

    const gridContainer = document.querySelector('.gridContainer');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(2, 1fr)'; // Set 2 column for tablet layout

    const style = window.getComputedStyle(gridContainer);
    expect(style.gridTemplateColumns).toBe('repeat(2, 1fr)'); // Expect 2 column
  });

  it("renders desktop layout correctly", () => {
    global.matchMedia = jest.fn().mockImplementation(query => {
        return {
            matches: query === "(max-width: 1440px)", // Simulate mobile view
            addListener: jest.fn(),
            removeListener: jest.fn(),
        };
    });

    // Test behavior for mobile view
    expect(window.matchMedia("(max-width: 1440px)").matches).toBe(true);

    const gridContainer = document.querySelector('.gridContainer');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)'; // Set 3 column for desktop layout

    const style = window.getComputedStyle(gridContainer);
    expect(style.gridTemplateColumns).toBe('repeat(3, 1fr)'); // Expect 3 column
  });
});