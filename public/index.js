// Added event listener to make the loading of the page smoother.
document.addEventListener('DOMContentLoaded', function () {

    // Vue instance for the web store
    let webstore = new Vue({
        el: "#app",
        data: {
            // Initializing data properties
            lessons: null, // Holds lesson data retrieved from lessons.json
            cart: {}, // Keeps track of items in the cart
            formData: { // Form data for customer details
                name: "",
                number: ""
            },
            showCart: false, // Tracks whether to display the cart
            search: "", // Search query for filtering lessons
            sortOption: "price", // Default sorting option for lessons
            orderOption: "ascending" // Default order for sorting (ascending/descending)
        },

        created() {
            // Fetching lesson data when the Vue instance is created
            // Initializing 'lessons' data property with fetched data
            fetch('https://web-app-coursework-2.vercel.app/lessons')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    this.lessons = data;
                })
                .catch(error => {
                    console.error('Error loading JSON data', error);
                });
        },

        methods: {
            // Add a lesson to the cart
            addToCart(lessonID) {
                // Retrieve necessary data
                const CART = this.cart;
                const QUANTITY_IN_CART = CART[lessonID];

                // Set a const for null (for readability)
                const ZERO_QUANTITY = null;

                // Calculate new quantity to add to cart
                const NEW_QUANTITY = ((QUANTITY_IN_CART == ZERO_QUANTITY) ? (1) : (QUANTITY_IN_CART + 1));

                // Find the lesson being added and decrement available spaces
                const ADDED_LESSON = this.lessons.find((lesson) => lesson.id === lessonID);


                // Update cart with new quantity and adjust lesson spaces
                this.$set(CART, lessonID, NEW_QUANTITY);
                // Decrease available spaces for the lesson
                ADDED_LESSON.spaces--;
            },

            // Remove a lesson from the cart
            removeFromCart(lessonID) {
                // Retrieve necessary data
                const CART = this.cart;
                const QUANTITY_IN_CART = CART[lessonID];

                // Calculate reduced quantity and find the lesson
                const REDUCED_QUANTITY = QUANTITY_IN_CART - 1;
                const ADDED_LESSON = this.lessons.find((lesson) => lesson.id === lessonID);


                // Update cart with reduced quantity and adjust lesson spaces
                this.$set(CART, lessonID, REDUCED_QUANTITY);

                // If quantity becomes zero, remove lesson from cart
                if (REDUCED_QUANTITY === 0) {
                    this.$delete(CART, lessonID);
                }

                // Increase available spaces for the lesson
                ADDED_LESSON.spaces++;
            },

            // Process the order form submission
            orderFormSubmit() {
                // Gather necessary data for the order
                const CUSTOMER_DETAIL = this.formData;
                const CART_ITEMS = this.cart;
                const TOTAL_PRICE = this.cartPrice;

                // Create order object and stringify for display
                const ORDER = {
                    customerData: CUSTOMER_DETAIL,
                    cart: CART_ITEMS,
                    total: TOTAL_PRICE
                };
                const ORDER_JSON_STRING = JSON.stringify(ORDER, null, 2);

                // Set CURRENT_PAGE const
                const CURRENT_PAGE = window.location;

                // // Generates order confirmation alert.
                // alert(`Order Placed!\n\n${ORDER_JSON_STRING}`);

                fetch('https://web-app-coursework-2.vercel.app/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: ORDER_JSON_STRING
                })
                    .then((response) => {
                        if (!response.ok) {
                            return response.text().then(text => {
                                throw new Error(text);
                            })
                        }

                        return response.json();
                    })
                    .then(data => {
                        alert(data.message);
                        CURRENT_PAGE.reload();
                    })
                    .catch((error) => {
                        alert(error.message);
                        // Handle errors here
                    });

                // Reload current page
                // CURRENT_PAGE.reload();
            },

            // Restrict input in the 'name' field to alphabetic characters
            restrictNameInput(nameFieldInput) {
                // Get the form object
                const FORM_DATA = this.formData;

                // Get name from form
                const NAME_INPUT = nameFieldInput.target.value;
                // Selects everything, other than capital and small letters
                const NAME_REGEX = /[^A-Za-z]/g;
                // Removes all selected characters
                const SANITISED_NAME_INPUT = NAME_INPUT.replace(NAME_REGEX, '');

                // Reassign name field
                FORM_DATA["name"] = SANITISED_NAME_INPUT; // Update form data with sanitized input
            },

            // Restrict input in the 'number' field to numeric characters
            restrictPhoneNumberInput(phoneNumberFieldInput) {
                // Get the form object
                const FORM_DATA = this.formData;

                // Get the number from the form
                const PHONE_NUMBER_INPUT = phoneNumberFieldInput.target.value;
                // Selects everything, other than numbers.
                const PHONE_NUMBER_REGEX = /\D/g;
                // Remove selected characters
                const SANITISED_PHONE_NUMBER_INPUT = PHONE_NUMBER_INPUT.replace(PHONE_NUMBER_REGEX, '');

                // Reassign number field
                FORM_DATA["number"] = SANITISED_PHONE_NUMBER_INPUT; // Update form data with sanitized input
            }
        },

        computed: {
            // Filter lessons based on the search query
            filteredLessons() {
                // Gather all the necessary data
                const LESSONS = this.lessons;
                const CATEGORIES_TO_SEARCH = ['subject', 'location', 'price', 'spaces'];
                const QUERY = this.search.toLowerCase();

                // Return filtered lessons
                return LESSONS.filter(
                    // For each lesson...
                    (lesson) => CATEGORIES_TO_SEARCH.some(
                        // ...and for each of its attributes...
                        (attribute) => {
                            // ...take its value, format it...
                            const ATTRIBUTE_VALUE = lesson[attribute];
                            const FORMATTED_ATTRIBUTE_VALUE = ATTRIBUTE_VALUE.toString().toLowerCase();

                            // ...and check whether it includes the QUERY
                            return FORMATTED_ATTRIBUTE_VALUE.includes(QUERY)
                        }
                    )
                )
            },

            // Sort lessons based on selected option
            sortedLessons() {
                // Gather all the necessary data
                const FILTERED_LESSONS = this.filteredLessons;
                const ATTRIBUTE_TO_SORT_BY = this.sortOption;
                // All functions below sort in ascending
                const SORT_FUNCTION_SELECTOR = {
                    'subject': (lesson1, lesson2) => lesson1.subject.localeCompare(lesson2.subject),
                    'price': (lesson1, lesson2) => lesson1.price - lesson2.price,
                    'location': (lesson1, lesson2) => lesson1.location.localeCompare(lesson2.location),
                    'spaces': (lesson1, lesson2) => lesson1.spaces - lesson2.spaces
                };

                // Return sorted filtered lessons based on ATTRIBUTE_TO_SORT_BY
                return FILTERED_LESSONS.sort(SORT_FUNCTION_SELECTOR[ATTRIBUTE_TO_SORT_BY]);
            },

            // Order lessons based on selected option (ascending/descending)
            orderedLessons() {
                // Gather necessary data
                // Creating a copy, as .reverse() changes array in-place
                const SORTED_LESSONS = this.sortedLessons.slice();
                const ORDER_BY = this.orderOption;

                // if we need descending reverse filtered sorted lessons...
                if (ORDER_BY === 'descending') {
                    return SORTED_LESSONS.reverse();
                }
                // ...else just return the original filtered sorted lessons.
                return SORTED_LESSONS;
            },

            // Prepare cart contents for display
            cartTableContents() {
                // Gather necessary data
                const CART_IS_EMPTY = this.isCartEmpty;
                const CART_ITEMS = Object.entries(this.cart);

                // If the cart is empty, go back to Lessons page.
                if (CART_IS_EMPTY) {
                    this.showCart = false;
                    return;
                }

                // Else, generate objects based on the cart,
                // which will be used to generate the table of cart items
                let cartTableEntries = [];
                CART_ITEMS.forEach(
                    ([lessonID, quantity]) => {

                        const LESSON = this.lessons.find((lesson) => lesson.id === parseInt(lessonID));
                        cartTableEntries.push(
                            {
                                lesson: LESSON,
                                quantity: quantity,
                                subtotal: LESSON.price * quantity
                            }
                        )
                    }
                )

                // Sort table entries by their subject,
                // else they will be ordered by their IDs,
                // which are not displayed
                cartTableEntries.sort(
                    (entry1, entry2) => entry1.lesson.subject.localeCompare(entry2.lesson.subject)
                )

                return cartTableEntries;
            },

            // Calculate the total price of items in the cart
            cartPrice() {
                const CART_ITEMS = this.cartTableContents;
                const TOTAL_PRICE = CART_ITEMS.reduce(((acc, entry) => acc + entry.subtotal), 0);


                return TOTAL_PRICE;
            },

            // Check if the cart is empty
            isCartEmpty() {
                return !Object.keys(this.cart).length;
            }
        }
    });
})

