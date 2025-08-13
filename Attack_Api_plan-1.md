# Simple Login With Hashing API
## Techinical Design Document

---

# 1. Planned Vulnerabilities:


** Poor hashing algorithm: **
- *** Create a from scratch hashing algorithm than has a set way of obscuring passwords ***
- *** Use simple ASCII values to obscure regular password ***
- *** move each character down by the length of the password in ASCII value ***
- *** Generate 20 or so random characters to throw at the end of obscured password ***

** Random logging: **
- *** Log random requests EX. chuck norris api calls ***
- *** Throw in random hashed password in the middle of the noise ***

** Email Hashing: **
- *** hash email address and add it to the password ***

** Hash Method headers: **
- *** Make code unecessesarily complex via hashing within code ***
- *** Adds no security but makes readability impossible ***


---

# 2. Implimentation:

** Simple Rest API format: **
- *** Use JS and Express to make a simple API request format ***
- *** Write obscured code ***


---

# 3. Testing:

** Postman Collection: **
- *** Use Postman to test as we go ***