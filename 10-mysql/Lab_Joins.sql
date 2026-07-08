USE SalesLT;
-- Tables Used and their descriptions
-- SHOW TABLES;
-- DESCRIBE SalesLT.Customer;
-- DESCRIBE SalesOrderHeader;
-- DESCRIBE SalesLT.Product;
-- DESCRIBE SalesLT.Address;
-- DESCRIBE CustomerAddress;
-- DESCRIBE Product;
-- DESCRIBE ProductCategory;
-- DESCRIBE ProductDescription;
-- DESCRIBE ProductModel;

-- Section 1: Inner Joins
-- Task 1.3
SELECT
	SalesLT.Product.Name AS ProductName, 
    SalesLT.ProductCategory.Name AS Category
FROM SalesLT.Product
INNER JOIN SalesLT.ProductCategory
     ON SalesLT.Product.ProductCategoryID = SalesLT.ProductCategory.ProductCategoryID;

-- Task 1.6
SELECT
	SalesLT.Product.Name AS ProductName, 
	SalesLT.ProductCategory.Name AS Category
FROM SalesLT.Product
JOIN SalesLT.ProductCategory
  ON SalesLT.Product.ProductCategoryID = SalesLT.ProductCategory.ProductCategoryID;

-- Task 1.7
SELECT 
	p.Name AS ProductName, 
	c.Name AS Category
FROM SalesLT.Product AS p
JOIN SalesLT.ProductCategory AS c
	ON p.ProductCategoryID = c.ProductCategoryID;

-- Task 1.9
SELECT 
     oh.OrderDate, 
     oh.SalesOrderNumber, 
     p.Name AS ProductName, 
     od.OrderQty, 
     od.UnitPrice, 
     od.LineTotal
FROM SalesLT.SalesOrderHeader AS oh
JOIN SalesLT.SalesOrderDetail AS od
	ON od.SalesOrderID = oh.SalesOrderID
JOIN SalesLT.Product AS p
	ON od.ProductID = p.ProductID
ORDER BY 
	oh.OrderDate, 
	oh.SalesOrderID, 
	od.SalesOrderDetailID;

-- SECTION 2: Use outer joins
-- Task 1.1

-- to retrieve a list of all customers and any orders they 
-- have placed, including customers who have registered 
-- but never placed an order.

SELECT 
    c.CustomerID, 
    CONCAT(c.FirstName, ' ' , c.LastName) AS CustomerName, 
    oh.SalesOrderID
FROM SalesLT.Customer AS c
LEFT OUTER JOIN SalesLT.SalesOrderHeader AS oh
        ON c.CustomerID = oh.CustomerID
ORDER BY oh.SalesOrderID DESC;

-- Verify LEFT Join (Refer: Sub Queries Concept)
SELECT DISTINCT CustomerID FROM Customer WHERE CustomerID NOT IN
(SELECT DISTINCT CustomerID FROM SalesOrderHeader);

-- Task 1.3
SELECT p.Name As ProductName, oh.SalesOrderNumber
FROM SalesLT.Product AS p
LEFT JOIN SalesLT.SalesOrderDetail AS od
    ON p.ProductID = od.ProductID
LEFT JOIN SalesLT.SalesOrderHeader AS oh
    ON od.SalesOrderID = oh.SalesOrderID
ORDER BY p.ProductID;

-- SECTION 3: Use cross joins (Optional)
SELECT
	p.Name, 
	CONCAT(c.FirstName, ' ', c.MiddleName,' ', c.LastName) AS CustomerName
FROM SalesLT.Product AS p
CROSS JOIN SalesLT.Customer AS c;

-- CHALLENGES
-- Challenge 1: Generate invoice reports
-- Challenge 1.1
-- Retrieve customer orders
SELECT 
	c.CustomerID, 
	oh.SalesOrderID, 
	oh.TotalDue
FROM SalesLT.Customer c 
JOIN SalesLT.SalesOrderHeader oh
	ON c.CustomerID = oh.CustomerID; 

-- Retrieve customer orders with addresses
SELECT 
	c.CustomerID, 
	oh.SalesOrderID, 
	oh.TotalDue, 
	CONCAT(a.AddressLine1 , ', ' , IFNULL(a.AddressLine2,'')) AS Address,
	a.City ,
	a.PostalCode 
FROM SalesLT.Customer c 
JOIN SalesLT.SalesOrderHeader oh
	ON c.CustomerID = oh.CustomerID
JOIN SalesLT.CustomerAddress ca
	ON c.CustomerID = ca.CustomerID 
JOIN SalesLT.Address a 
	ON a.AddressID = ca.AddressID ;

-- Challenge 2: Retrieve customer data
-- Retrieve a list of customers with no address
-- Using SubQueries
SELECT 
	c.CustomerID,
	CONCAT(c.FirstName,' ',c.MiddleName,' ', c.LastName) as CustomerName
FROM Customer c 
WHERE c.CustomerID NOT IN
	(SELECT CustomerID FROM CustomerAddress);

-- Using Joins
SELECT 
	c.CustomerID,
	CONCAT(c.FirstName,' ',c.MiddleName,' ', c.LastName) as CustomerName,
	ca.AddressID 
FROM Customer c 
LEFT JOIN CustomerAddress ca 
	ON c.CustomerID = ca.CustomerID
WHERE ca.AddressID IS NULL
ORDER BY CustomerID;

-- Verify
-- The total count of customers = customers with address + customers without address

-- Count of Customers with address: 417
SELECT COUNT(*) FROM CustomerAddress ca ;
-- OR
SELECT 
	c.CustomerID,
	CONCAT(c.FirstName,' ',c.MiddleName,' ', c.LastName) as CustomerName,
	ca.AddressID 
FROM Customer c 
LEFT JOIN CustomerAddress ca 
	ON c.CustomerID = ca.CustomerID
WHERE ca.AddressID IS NOT NULL
ORDER BY CustomerID;

-- Count of Customers without address: 440 (as noted above)
-- Customers with multiple address: 10
SELECT 
	CustomerID,
	COUNT(*) AS Address_Counts
FROM CustomerAddress ca 
GROUP BY ca.CustomerID 
HAVING Address_Counts > 1
ORDER BY Address_Counts DESC;
-- Count of Customers: 847 (440 + 417 - 10)
SELECT DISTINCT CustomerID FROM Customer;

-- Retrieve a list of all customers and their sales orders
-- list of all customer companies account number
-- Customers who have not placed any orders should be excluded where Sales order ID 
-- and total due are NULL.
SELECT 
    c.CompanyName,
    soh.CustomerID,
    soh.SalesOrderID,
    soh.PurchaseOrderNumber,
    soh.AccountNumber,
    DATE_FORMAT(soh.OrderDate, '%Y-%m-%d') AS OrderDate,
    soh.TotalDue,
    IFNULL(soh.TaxAmt, 0) +
    IFNULL(soh.Freight, 0) +
    IFNULL(soh.TotalDue, 0) AS TaxFreightAmt
FROM SalesOrderHeader soh
JOIN Customer c
    ON c.CustomerID = soh.CustomerID
ORDER BY soh.OrderDate DESC;

-- Challenge 3: Create a product catalog
-- Retrieve product information by category
-- list products by parent category and subcategory

-- Category & Sub Category are obtained from selfjoin
SELECT 
	pc1.ProductCategoryID, 
	pc1.Name AS Category,
	pc2.Name AS SubCategory
FROM ProductCategory pc1
JOIN ProductCategory pc2 
	ON pc1.ProductCategoryID = pc2.ParentProductCategoryID;

-- Product Catalog
SELECT 
    p.ProductID,
    p.Name AS ProductName,
    pc1.ProductCategoryID AS SubCategoryID,
    pc1.Name AS SubCategory,
    pc2.ProductCategoryID AS CategoryID,
    pc2.Name AS Category
FROM Product p
JOIN ProductCategory pc1
    ON p.ProductCategoryID = pc1.ProductCategoryID
JOIN ProductCategory pc2
    ON pc1.ParentProductCategoryID = pc2.ProductCategoryID;
