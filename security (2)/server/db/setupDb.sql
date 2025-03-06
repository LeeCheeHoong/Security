-- public."attribute" definition

-- Drop table

-- DROP TABLE public."attribute";

CREATE TABLE public."attribute" (
	id serial4 NOT NULL,
	"attribute" varchar(100) NOT NULL,
	CONSTRAINT attribute_attribute_key UNIQUE (attribute),
	CONSTRAINT attribute_pkey PRIMARY KEY (id)
);


-- public.userlist definition

-- Drop table

-- DROP TABLE public.userlist;

CREATE TABLE public.userlist (
	id serial4 NOT NULL,
	username varchar(50) NOT NULL,
	"name" varchar(100) NULL,
	attribute_id _int4 NULL,
	CONSTRAINT userlist_pkey PRIMARY KEY (id),
	CONSTRAINT userlist_username_key UNIQUE (username)
);


-- public.userlogin definition

-- Drop table

-- DROP TABLE public.userlogin;

CREATE TABLE public.userlogin (
	id serial4 NOT NULL,
	username varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	verification_token varchar NULL,
	token_expiry timestamp NULL,
	CONSTRAINT userlogin_pkey PRIMARY KEY (id),
	CONSTRAINT userlogin_username_key UNIQUE (username)
);

CREATE TABLE seller_detail (
    id SERIAL PRIMARY KEY,      -- Unique ID for each seller
    user_id INT NOT NULL, -- Seller's username (must be unique)
	name VARCHAR(50),
    description TEXT,             -- Description of the seller
    CONSTRAINT fk_seller FOREIGN KEY (user_id) REFERENCES userlist(id) ON DELETE CASCADE
);

CREATE TABLE public."item_status" (
	id serial4 NOT NULL,
	"item_status" varchar(100) NOT NULL,
	CONSTRAINT item_status_item_status_key UNIQUE (item_status),
	CONSTRAINT item_status_pkey PRIMARY KEY (id)
);

CREATE TABLE item_detail (
    id SERIAL PRIMARY KEY,       -- Unique ID for each item
    item VARCHAR(100) NOT NULL,  -- Item name
    seller_id INT NOT NULL,      -- Foreign key referencing seller_detail
    description TEXT,            -- Item description
    price NUMERIC(10,2) NOT NULL, -- Price with up to 2 decimal places
	item_status INT NOT NULL,
	buyer_id INT,
    CONSTRAINT fk_seller FOREIGN KEY (seller_id) REFERENCES seller_detail(id) ON DELETE CASCADE,
    CONSTRAINT fk_status FOREIGN KEY (item_status) REFERENCES item_status(id) ON DELETE CASCADE
);


INSERT INTO public."attribute" ("attribute") VALUES
	 ('NEW_USER'),
	 ('SELLER'),
	 ('ADMIN'),
	 ('VERIFIED'),
	 ('BUYER'),
	 ('PENDING_SELLER');

INSERT INTO public.userlist
(id, username, "name", attribute_id)
VALUES(nextval('userlist_id_seq'::regclass), 'admin', '', '{3}');

INSERT INTO public.userlogin
(id, username, "password", verification_token, token_expiry)
VALUES(nextval('userlogin_id_seq'::regclass), 'admin', '$2b$10$XStqxS2qxmnVBx0EUc7DKeio2E.svia9ZmxXK0rr.jxGRHOkjze7y', '', NULL);

INSERT INTO public."item_status" ("item_status") VALUES
	 ('AVAILABLE'),
	 ('RESERVED'),
	 ('SOLD');
