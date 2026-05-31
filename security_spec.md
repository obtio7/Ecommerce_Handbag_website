# Handbag Haven Security Specification

## Data Invariants
1. A review cannot be created without a valid product ID.
2. A wishlist item must belong to the logged-in user.
3. Orders can be created by guests (guestId) or logged-in users.
4. Product stock can only be modified by the system or admins.
5. Users can only read their own orders and wishlist.
6. Reviews are public to read but can only be written by authenticated users.

## The Dirty Dozen Payloads (Targeted for Denial)
1. Creating a product as a non-admin.
2. Modifying the price of a product as a user.
3. Writing a review for a non-existent product.
4. Spoofing another user's ID in a wishlist item.
5. Reading the full `orders` collection as a standard user.
6. Updating a terminal order status (e.g., from 'delivered' to 'pending').
7. Injecting 1MB of garbage text into a review comment.
8. Deleting a review written by someone else.
9. Creating an order with a negative total amount.
10. Adding a product to someone else's wishlist.
11. Reading private shipping addresses of other guest checkouts.
12. Bulk querying all reviews across all products via collectionGroup without authorization.

## Test Strategy
The `firestore.rules` will be validated against these payloads using the local emulator/test runner logic.
