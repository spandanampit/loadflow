import $ from 'jquery';
console.log("here calling -------");

// Ensure jQuery is binding to the DOM elements after they are rendered
$(".element-icon").on("click", () => {
    console.log("clicked ------------");
});