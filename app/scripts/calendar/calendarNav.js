/**
 * ...
 * @param {Object} ref
 */
function routeChanged(ref) {
    console.log(ref);
    ref.classList.toggle('active');
}