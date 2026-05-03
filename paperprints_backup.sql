--
-- PostgreSQL database dump
--

\restrict gYYqx0pg5yMwJwJ5G4aNLgQs6yiqe9goS7QHziUcpXizSfpa9an1GsNveklowiR

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'PROCESSING',
    'READY',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public.payment_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: file_pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.file_pages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    file_id uuid NOT NULL,
    page_number integer NOT NULL,
    is_color boolean DEFAULT false NOT NULL
);


ALTER TABLE public.file_pages OWNER TO postgres;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    file_url text NOT NULL,
    s3_key text NOT NULL,
    file_name text NOT NULL,
    file_size_bytes bigint DEFAULT 0 NOT NULL,
    total_pages integer DEFAULT 0 NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.files OWNER TO postgres;

--
-- Name: order_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    file_id uuid NOT NULL,
    label text,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.order_files OWNER TO postgres;

--
-- Name: order_pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_pages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    page_number integer NOT NULL,
    print_type text DEFAULT 'BW'::text NOT NULL,
    CONSTRAINT order_pages_print_type_check CHECK ((print_type = ANY (ARRAY['BW'::text, 'COLOR'::text])))
);


ALTER TABLE public.order_pages OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number text NOT NULL,
    user_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    file_id uuid NOT NULL,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    copies integer DEFAULT 1 NOT NULL,
    is_double_sided boolean DEFAULT false NOT NULL,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    estimated_time integer,
    qr_code_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    payment_method text,
    transaction_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_payment_method_check CHECK ((payment_method = ANY (ARRAY['UPI'::text, 'CASH'::text, 'CARD'::text])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    password_hash text,
    firebase_uid text,
    photo_url text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['user'::text, 'vendor'::text, 'admin'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vendor_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendor_id uuid NOT NULL,
    price_bw numeric(8,2) DEFAULT 1.00 NOT NULL,
    price_color numeric(8,2) DEFAULT 5.00 NOT NULL,
    price_double_sided numeric(8,2),
    opening_time time without time zone,
    closing_time time without time zone,
    max_file_size_mb integer DEFAULT 50 NOT NULL,
    avg_processing_min integer DEFAULT 15 NOT NULL,
    capabilities text[] DEFAULT '{}'::text[] NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendor_settings OWNER TO postgres;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    shop_name text NOT NULL,
    owner_name text NOT NULL,
    phone text,
    email text,
    address text,
    location_lat double precision,
    location_lng double precision,
    is_active boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Data for Name: file_pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.file_pages (id, file_id, page_number, is_color) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files (id, user_id, file_url, s3_key, file_name, file_size_bytes, total_pages, uploaded_at) FROM stdin;
f0000001-0000-0000-0000-000000000001	c0000001-0000-0000-0000-000000000001	http://localhost:3000/uploads/resume_rahul.pdf	uploads/resume.pdf	Resume_Devansh_2026.pdf	524288	3	2026-04-20 09:20:04.405834+05:30
f0000002-0000-0000-0000-000000000002	c0000002-0000-0000-0000-000000000002	http://localhost:3000/uploads/thesis_priya.pdf	uploads/thesis.pdf	Research_Paper_ML.pdf	2097152	18	2026-04-23 09:20:04.405834+05:30
f0000003-0000-0000-0000-000000000003	c0000003-0000-0000-0000-000000000003	http://localhost:3000/uploads/id_cards.pdf	uploads/id.pdf	Aadhar_PAN_Copies.pdf	1048576	4	2026-04-25 09:20:04.405834+05:30
f0000004-0000-0000-0000-000000000004	c0000004-0000-0000-0000-000000000004	http://localhost:3000/uploads/notes_sneha.pdf	uploads/notes.pdf	Organic_Chemistry_Ch7.pdf	3145728	32	2026-04-28 09:20:04.405834+05:30
f0000005-0000-0000-0000-000000000005	c0000005-0000-0000-0000-000000000005	http://localhost:3000/uploads/wedding_card.pdf	uploads/wedding.pdf	Birthday_Invitation.pdf	4194304	2	2026-04-30 09:20:04.405834+05:30
f0000006-0000-0000-0000-000000000006	c0000006-0000-0000-0000-000000000006	http://localhost:3000/uploads/project_report.pdf	uploads/report.pdf	Capstone_Report_v3.pdf	5242880	48	2026-05-02 03:20:04.405834+05:30
f0000007-0000-0000-0000-000000000007	c0000001-0000-0000-0000-000000000001	http://localhost:3000/uploads/assignment.pdf	uploads/assign.pdf	DBMS_Assignment_5.pdf	262144	6	2026-05-02 08:20:04.405834+05:30
f0000008-0000-0000-0000-000000000008	c0000003-0000-0000-0000-000000000003	http://localhost:3000/uploads/resume_rahul.pdf	uploads/rent.pdf	Rent_Agreement_2026.pdf	786432	8	2026-05-02 08:50:04.405834+05:30
\.


--
-- Data for Name: order_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_files (id, order_id, file_id, label, sort_order) FROM stdin;
\.


--
-- Data for Name: order_pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_pages (id, order_id, page_number, print_type) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, user_id, vendor_id, file_id, status, copies, is_double_sided, total_price, estimated_time, qr_code_url, created_at, updated_at) FROM stdin;
a0000001-1111-1111-1111-111111111111	PP-20260502-A1B2	c0000001-0000-0000-0000-000000000001	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000001-0000-0000-0000-000000000001	PENDING	3	f	45.00	\N	\N	2026-05-02 10:41:59.055713+05:30	2026-05-02 10:41:59.055713+05:30
a0000002-2222-2222-2222-222222222222	PP-20260502-C3D4	c0000002-0000-0000-0000-000000000002	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000002-0000-0000-0000-000000000002	PENDING	1	t	120.00	\N	\N	2026-05-02 10:46:59.055713+05:30	2026-05-02 10:46:59.055713+05:30
a0000003-3333-3333-3333-333333333333	PP-20260502-E5F6	c0000004-0000-0000-0000-000000000004	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000004-0000-0000-0000-000000000004	PENDING	2	f	64.00	\N	\N	2026-05-02 10:48:59.055713+05:30	2026-05-02 10:48:59.055713+05:30
a0000004-4444-4444-4444-444444444444	PP-20260502-G7H8	c0000003-0000-0000-0000-000000000003	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000003-0000-0000-0000-000000000003	ACCEPTED	1	f	18.00	15	\N	2026-05-02 10:24:59.055713+05:30	2026-05-02 10:29:59.055713+05:30
a0000005-5555-5555-5555-555555555555	PP-20260502-I9J0	c0000005-0000-0000-0000-000000000005	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000005-0000-0000-0000-000000000005	ACCEPTED	4	t	210.00	30	\N	2026-05-02 10:31:59.055713+05:30	2026-05-02 10:34:59.055713+05:30
a0000007-7777-7777-7777-777777777777	PP-20260501-M3N4	c0000001-0000-0000-0000-000000000001	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000007-0000-0000-0000-000000000007	COMPLETED	2	f	28.00	20	\N	2026-05-02 07:49:59.055713+05:30	2026-05-02 08:49:59.055713+05:30
a0000008-8888-8888-8888-888888888888	PP-20260501-O5P6	c0000004-0000-0000-0000-000000000004	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000008-0000-0000-0000-000000000008	COMPLETED	1	t	55.00	15	\N	2026-05-02 05:49:59.055713+05:30	2026-05-02 06:49:59.055713+05:30
a0000009-9999-9999-9999-999999999999	PP-20260501-Q7R8	c0000003-0000-0000-0000-000000000003	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000002-0000-0000-0000-000000000002	REJECTED	1	f	120.00	\N	\N	2026-05-02 04:49:59.055713+05:30	2026-05-02 04:49:59.055713+05:30
a0000010-aaaa-aaaa-aaaa-aaaaaaaaaaaa	PP-20260430-S9T0	c0000006-0000-0000-0000-000000000006	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000006-0000-0000-0000-000000000006	REJECTED	5	f	175.00	\N	\N	2026-05-01 10:49:59.055713+05:30	2026-05-01 10:49:59.055713+05:30
a0000006-6666-6666-6666-666666666666	PP-20260502-K1L2	c0000006-0000-0000-0000-000000000006	a1b2c3d4-e5f6-7890-abcd-ef1234567890	f0000006-0000-0000-0000-000000000006	COMPLETED	1	f	35.00	10	https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=order:a0000006	2026-05-02 10:04:59.055713+05:30	2026-05-03 01:13:37.537018+05:30
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, order_id, amount, status, payment_method, transaction_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, firebase_uid, photo_url, role, created_at, updated_at) FROM stdin;
2fbb8961-d697-4259-af3e-c343d46d38d4	Anujj Pal	vasupal772@gmail.com	\N	\N	fGfkOV570rYF6QTDqTl6hebtZFm1	https://lh3.googleusercontent.com/a/ACg8ocJNj0ggaJaxPYBwr00KSsaVUfNsS3LUW-PRu6lUpgDhNZQ1ZJh4=s96-c	vendor	2026-05-02 07:09:39.870986+05:30	2026-05-02 07:09:39.870986+05:30
c0000001-0000-0000-0000-000000000001	Devansh Mehta	devansh.m@gmail.com	+91 9001100110	\N	\N	\N	user	2026-04-20 09:20:04.405834+05:30	2026-05-02 09:20:04.405834+05:30
c0000002-0000-0000-0000-000000000002	Riya Patel	riya.patel@outlook.com	+91 9002200220	\N	\N	\N	user	2026-04-23 09:20:04.405834+05:30	2026-05-02 09:20:04.405834+05:30
c0000003-0000-0000-0000-000000000003	Karan Nair	karan.nair@yahoo.com	+91 9003300330	\N	\N	\N	user	2026-04-25 09:20:04.405834+05:30	2026-05-02 09:20:04.405834+05:30
c0000004-0000-0000-0000-000000000004	Simran Kaur	simran.k@gmail.com	+91 9004400440	\N	\N	\N	user	2026-04-28 09:20:04.405834+05:30	2026-05-02 09:20:04.405834+05:30
c0000005-0000-0000-0000-000000000005	Arjun Reddy	arjun.reddy@gmail.com	+91 9005500550	\N	\N	\N	user	2026-04-30 09:20:04.405834+05:30	2026-05-02 09:20:04.405834+05:30
c0000006-0000-0000-0000-000000000006	Neha Sharma	neha.s99@gmail.com	+91 9006600660	\N	\N	\N	user	2026-05-01 09:20:04.405834+05:30	2026-05-02 09:20:04.405834+05:30
efbb7238-0a7c-46b7-898c-803aa7d1571a	Anuj Pal	anujworks2@gmail.com	\N	\N	xHhlRVmB6XhDrIANO5EVBeVierw2	https://lh3.googleusercontent.com/a/ACg8ocLLXEHX9A7k_J5z26a4xwK0P3jzCjiUOcyjTcEQzCBX5sAXJCg=s96-c	vendor	2026-05-03 07:45:30.386266+05:30	2026-05-03 07:45:30.386266+05:30
\.


--
-- Data for Name: vendor_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendor_settings (id, vendor_id, price_bw, price_color, price_double_sided, opening_time, closing_time, max_file_size_mb, avg_processing_min, capabilities, updated_at) FROM stdin;
b2c3d4e5-f6a7-8901-bcde-f12345678901	a1b2c3d4-e5f6-7890-abcd-ef1234567890	3.00	5.00	0.50	09:00:00	21:00:00	50	15	{color,binding,lamination}	2026-05-03 06:54:18.231729+05:30
4113cd35-8ab2-405c-b2d0-cc2cb3de0144	dc42fc5a-df23-452c-9399-85513d9da37c	5.00	10.00	1.00	09:00:00	21:00:00	50	15	{BW,COLOR}	2026-05-03 07:47:03.773276+05:30
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, user_id, shop_name, owner_name, phone, email, address, location_lat, location_lng, is_active, is_verified, created_at, updated_at) FROM stdin;
a1b2c3d4-e5f6-7890-abcd-ef1234567890	2fbb8961-d697-4259-af3e-c343d46d38d4	PaperPrint Express	Anujj Pal	+91 9876543210	vasupal772@gmail.com	Sector 62, Noida, UP	28.627	77.3649	f	t	2026-05-02 09:20:04.405834+05:30	2026-05-03 06:54:03.000759+05:30
dc42fc5a-df23-452c-9399-85513d9da37c	efbb7238-0a7c-46b7-898c-803aa7d1571a	AnujShop	Anuj Pal	+91 9140442926	anujworks2@gmail.com	Ghaziabad, Uttar Pradesh, 201016, India	28.6324214	77.4439432	t	f	2026-05-03 07:47:03.746226+05:30	2026-05-03 07:47:03.746226+05:30
\.


--
-- Name: file_pages file_pages_file_id_page_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_pages
    ADD CONSTRAINT file_pages_file_id_page_number_key UNIQUE (file_id, page_number);


--
-- Name: file_pages file_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_pages
    ADD CONSTRAINT file_pages_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: order_files order_files_order_id_file_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_order_id_file_id_key UNIQUE (order_id, file_id);


--
-- Name: order_files order_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_pkey PRIMARY KEY (id);


--
-- Name: order_pages order_pages_order_id_page_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_pages
    ADD CONSTRAINT order_pages_order_id_page_number_key UNIQUE (order_id, page_number);


--
-- Name: order_pages order_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_pages
    ADD CONSTRAINT order_pages_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendor_settings vendor_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_settings
    ADD CONSTRAINT vendor_settings_pkey PRIMARY KEY (id);


--
-- Name: vendor_settings vendor_settings_vendor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_settings
    ADD CONSTRAINT vendor_settings_vendor_id_key UNIQUE (vendor_id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: idx_files_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_files_user ON public.files USING btree (user_id);


--
-- Name: idx_order_files_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_files_order ON public.order_files USING btree (order_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id, created_at DESC);


--
-- Name: idx_orders_vendor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_vendor ON public.orders USING btree (vendor_id, created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_firebase_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_firebase_uid ON public.users USING btree (firebase_uid);


--
-- Name: idx_vendors_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_active ON public.vendors USING btree (is_active, is_verified);


--
-- Name: idx_vendors_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_location ON public.vendors USING btree (location_lat, location_lng);


--
-- Name: file_pages file_pages_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_pages
    ADD CONSTRAINT file_pages_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: files files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_files order_files_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: order_files order_files_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_files
    ADD CONSTRAINT order_files_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_pages order_pages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_pages
    ADD CONSTRAINT order_pages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: vendor_settings vendor_settings_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_settings
    ADD CONSTRAINT vendor_settings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gYYqx0pg5yMwJwJ5G4aNLgQs6yiqe9goS7QHziUcpXizSfpa9an1GsNveklowiR

