let webstore = new Vue({
    el: "#app",
    data: {
        lessons: null,
        cart: {},
        formData: {
            name: "",
            number: ""
        },
        showCart: false,
        search: "",
        sortOption: "price",
        orderOption: "ascending"
    },

    created() {
        // Using created() to initialise values before it gets used.
        // Need to use Fetch API, as 'import' is not available.
        fetch('lessons.json')
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
        addToCart(lessonID) {
            const CART = this.cart;
            const QUANTITY_IN_CART = CART[lessonID];
            const ZERO_QUANTITY = null;
            const NEW_QUANTITY = ((QUANTITY_IN_CART == ZERO_QUANTITY) ? (1) : (QUANTITY_IN_CART + 1));
            const ADDED_LESSON = this.lessons.find((lesson) => lesson.id === lessonID);


            this.$set(CART, lessonID, NEW_QUANTITY)
            ADDED_LESSON.spaces--;
        },

        removeFromCart(lessonID) {
            const CART = this.cart;
            const QUANTITY_IN_CART = CART[lessonID];
            const REDUCED_QUANTITY = QUANTITY_IN_CART - 1;
            const ADDED_LESSON = this.lessons.find((lesson) => lesson.id === lessonID);


            this.$set(CART, lessonID, REDUCED_QUANTITY)
            if (REDUCED_QUANTITY === 0) { this.$delete(CART, lessonID); }
            ADDED_LESSON.spaces++;
        },

        orderFormSubmit() {

            const ORDER = {
                formData: this.formData,
                cart: this.cart
            }
            const ORDER_STRING = JSON.stringify(ORDER, null, 2)
            const RELOAD_PAGE = window.location.reload();


            alert(`Order Placed!\n\n${ORDER_STRING}`);
            RELOAD_PAGE;
        },

        restrictNameInput(nameFieldInput) {
            const FORM_DATA = this.formData;

            const NAME_INPUT = nameFieldInput.target.value;
            const NAME_REGEX = /[^A-Za-z]/g;
            const SANITISED_NAME_INPUT = NAME_INPUT.replace(NAME_REGEX, '');


            FORM_DATA["name"] = SANITISED_NAME_INPUT;
        },

        restrictPhoneNumberInput(phoneNumberFieldInput) {
            const FORM_DATA = this.formData;

            const PHONE_NUMBER_INPUT = phoneNumberFieldInput.target.value;
            const PHONE_NUMBER_REGEX = /\D/g;
            const SANITISED_PHONE_NUMBER_INPUT = PHONE_NUMBER_INPUT.replace(PHONE_NUMBER_REGEX, '');


            FORM_DATA["number"] = SANITISED_PHONE_NUMBER_INPUT;
        }
    },

    computed: {
        filteredLessons() {
            const LESSONS = this.lessons;
            const CATEGORIES_TO_SEARCH = ['subject', 'location', 'price', 'spaces'];
            const QUERY = this.search.toLowerCase();


            return LESSONS.filter(
                (lesson) => CATEGORIES_TO_SEARCH.some(
                    (attribute) => {
                        const ATTRIBUTE_VALUE = lesson[attribute];
                        const FORMATTED_ATTRIBUTE_VALUE = ATTRIBUTE_VALUE.toString().toLowerCase();


                        return FORMATTED_ATTRIBUTE_VALUE.includes(QUERY)
                    }
                )
            )
        },

        sortedLessons() {
            const FILTERED_LESSONS = this.filteredLessons;
            const ATTRIBUTE_TO_SORT_BY = this.sortOption;
            const SORT_FUNCTION_SELECTOR = {
                'subject': (lesson1, lesson2) => lesson1.subject.localeCompare(lesson2.subject),
                'price': (lesson1, lesson2) => lesson1.price - lesson2.price,
                'location': (lesson1, lesson2) => lesson1.location.localeCompare(lesson2.location),
                'spaces': (lesson1, lesson2) => lesson1.spaces - lesson2.spaces
            };


            return FILTERED_LESSONS.sort(SORT_FUNCTION_SELECTOR[ATTRIBUTE_TO_SORT_BY]);
        },

        orderedLessons() {
            const SORTED_LESSONS = this.sortedLessons.slice();
            const ORDER_BY = this.orderOption;


            if (ORDER_BY === 'descending') {
                return SORTED_LESSONS.reverse();
            }
            return SORTED_LESSONS;
        },

        cartTableContents() {
            const CART_IS_EMPTY = this.isCartEmpty;
            const CART_ITEMS = Object.entries(this.cart);


            if (CART_IS_EMPTY) {
                this.showCart = false;
                return;
            }

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

            cartTableEntries.sort(
                (entry1, entry2) => entry1.lesson.subject.localeCompare(entry2.lesson.subject)
            )

            return cartTableEntries;
        },

        cartPrice() {
            const CART_ITEMS = this.cartTableContents;
            const TOTAL_PRICE = CART_ITEMS.reduce(((acc, entry) => acc + entry.subtotal), 0)


            return TOTAL_PRICE;

        },

        isCartEmpty() {
            return !Object.keys(this.cart).length;
        }
    }
});