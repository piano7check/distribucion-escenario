-- Coro Municipal Cochabamba — Distribución de Escenario
-- Esquema inicial: roster (integrantes), overrides de posición y de región
-- por diagrama. Reemplaza el localStorage del frontend por una base de
-- datos compartida en tiempo real.

-- ── Integrantes ──────────────────────────────────────────────────────────
create table if not exists roster (
  id text primary key,              -- número visible ("1".."134", "Ap1", "Lic1")
  name text not null,
  group_name text not null,         -- 'A' | 'B1' | 'B2'
  voice text,                       -- 'S1'|'S2'|'Mz'|'Ca'|'T1'|'T2'|'Br'|'Bj'|null
  since text,
  note text,
  on_leave boolean not null default false,
  sort_order integer not null,      -- preserva el orden del documento original,
                                     -- del cual depende el llenado automático
  created_at timestamptz not null default now()
);

-- ── Asignación de personas por posición ─────────────────────────────────
-- value: id de la persona asignada manualmente, o el literal 'EMPTY' para
-- una posición vaciada a propósito. Sin fila = usar el cálculo automático.
create table if not exists position_overrides (
  diagram_key text not null,        -- 'parte1_3' | 'segunda' | 'cuarta'
  slot_id text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (diagram_key, slot_id)
);

-- ── Región/voz de cada posición del escenario ───────────────────────────
-- (columna "value" con el mismo nombre que position_overrides a propósito:
-- el frontend usa el mismo hook genérico para ambas tablas)
create table if not exists slot_voice_overrides (
  diagram_key text not null,
  slot_id text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (diagram_key, slot_id)
);

-- ── Row Level Security ───────────────────────────────────────────────────
-- Lectura abierta a cualquiera con el link (incluye visitantes anónimos);
-- solo usuarios autenticados (los guías/director con cuenta) pueden editar.
alter table roster enable row level security;
alter table position_overrides enable row level security;
alter table slot_voice_overrides enable row level security;

create policy "roster_select_all" on roster for select using (true);
create policy "roster_write_authenticated" on roster for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "position_overrides_select_all" on position_overrides for select using (true);
create policy "position_overrides_write_authenticated" on position_overrides for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "slot_voice_overrides_select_all" on slot_voice_overrides for select using (true);
create policy "slot_voice_overrides_write_authenticated" on slot_voice_overrides for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── Realtime ─────────────────────────────────────────────────────────────
-- Permite que todos los clientes conectados vean los cambios de los demás
-- guías al instante, sin recargar la página.
alter publication supabase_realtime add table roster;
alter publication supabase_realtime add table position_overrides;
alter publication supabase_realtime add table slot_voice_overrides;

-- ── Datos iniciales (Componentes.pdf) ───────────────────────────────────
insert into roster (id, name, group_name, voice, since, note, on_leave, sort_order) values
('1', 'Daniela Andrea Albarracín', 'A', 'S1', '22-7', NULL, false, 0),
('2', 'Fernanda Valentina Camacho Garavito', 'A', 'S1', '23-3', NULL, false, 1),
('3', 'Dayana Mejia Herrera', 'A', 'S1', '24-3', NULL, false, 2),
('4', 'Estefanía Eukateryn Méndez Pamuri', 'A', 'S1', '24-3', NULL, false, 3),
('5', 'Andrea Simoné Lafuente Llanque', 'A', 'S1', '24-3', 'R.I.', false, 4),
('6', 'Valeria Olmos Delgado', 'A', 'S1', '26-3', NULL, false, 5),
('7', 'Isabella Rivero Padilla', 'A', 'S2', '22-7', NULL, false, 6),
('8', 'Honoria Mundocorre Choque', 'A', 'S2', '23-3', NULL, false, 7),
('9', 'Pamela Lourdes Llanque Alba', 'A', 'S2', '24-3', NULL, false, 8),
('10', 'Andrea Camila Barriga Rojas', 'A', 'S2', '24-3', NULL, false, 9),
('11', 'Vera Anette Farfan Arce', 'A', 'S2', '26-3', NULL, false, 10),
('12', 'María Teresa Mamani', 'A', 'Mz', '22-7', NULL, false, 11),
('13', 'Sandra Isabel Velasco de Peredo', 'A', 'Mz', '23-3', NULL, false, 12),
('14', 'Saida Viscarra Copa', 'A', 'Mz', '23-3', NULL, false, 13),
('15', 'Karen Copacondo Ramos', 'A', 'Mz', '24-3', NULL, false, 14),
('16', 'Marcia Rodríguez Mendoza', 'A', 'Mz', '25-3', NULL, false, 15),
('17', 'Shaiel Yumi Mayta Vargas', 'A', 'Mz', '26-3', NULL, false, 16),
('18', 'Lilian Avelina Jiménez Pérez', 'A', 'Ca', '22-7', NULL, false, 17),
('19', 'Katherine Vanessa Camargo Rocha', 'A', 'Ca', '22-7', NULL, false, 18),
('20', 'Jane Inés Estela Vilchez', 'A', 'Ca', '23-3', NULL, false, 19),
('21', 'Valeria Alexandra Catacora Robles', 'A', 'Ca', '24-3', NULL, false, 20),
('22', 'Leslie Karen Martínez Martínez', 'A', 'Ca', '26-3', NULL, false, 21),
('23', 'Herzey Nicole Ribeiro Sevilla', 'A', 'Ca', '26-3', NULL, false, 22),
('24', 'Luis Miguel Eysaguirre Perez', 'A', 'T1', '23-3', NULL, false, 23),
('25', 'Gustavo Rojas Valdivia', 'A', 'T1', '24-3', NULL, false, 24),
('26', 'Hansel Aarom Roman Escalante', 'A', 'T1', '26-3', NULL, false, 25),
('27', 'Juan Pablo Loras Soliz', 'A', 'T2', '22-7', NULL, false, 26),
('28', 'Luis Rodrigo Badani Gómez', 'A', 'T2', '23-3', NULL, false, 27),
('29', 'Xander Harbay Ballivian Perlas', 'A', 'Br', '23-3', 'R.I.', false, 28),
('30', 'Juan Antonio Villca Rocha', 'A', 'Br', '24-3', NULL, false, 29),
('31', 'Juan Manuel Chacon Villarroel', 'A', 'Br', '25-3', NULL, false, 30),
('32', 'Ramiro Gernot Montero Perez', 'A', 'Br', '26-3', NULL, false, 31),
('33', 'Ruben Tirado Ramirez', 'A', 'Bj', '22-7', 'Lic. Lunes', false, 32),
('34', 'Eduardo Edgar Castellón Urdininea', 'A', 'Bj', '24-3', NULL, false, 33),
('35', 'Jaime Ezequiel Torrico Arancibia', 'A', 'Bj', '25-3', NULL, false, 34),
('36', 'Ruben Orlando Cruz Blanco', 'A', 'Bj', '26-3', NULL, false, 35),
('37', 'Stephan Caba Miranda', 'A', 'Bj', '26-3', NULL, false, 36),
('38', 'Mauro Gerardo Vargas Gonzales', 'A', 'Bj', '26-3', NULL, false, 37),
('Ap1', 'Carla Patricia Escalera Muñoz', 'A', 'S1', '22-7', 'Apoyo', false, 38),
('Ap2', 'Daisy Mundocorre Choque', 'A', 'S1', '23-3', 'Apoyo', false, 39),
('Ap3', 'Mario Colque Condori', 'A', 'Bj', '23-3', 'Apoyo', false, 40),
('Lic1', 'Alejandro Guillermo Garcia Mancilla', 'A', 'T1', '22-7', 'Licencia', true, 41),
('39', 'Abigail Wanda Aramayo Arispe', 'B1', NULL, '26-3', NULL, false, 42),
('40', 'Abner Gonzales Chambi', 'B1', NULL, '26-3', NULL, false, 43),
('41', 'Alexander Terceros Salazar', 'B1', NULL, '26-3', NULL, false, 44),
('42', 'Amaya Arlen Romero Seleme', 'B1', NULL, '26-3', NULL, false, 45),
('43', 'Andrea Denisse Paño Mendez', 'B1', 'Ca', '23-3', NULL, false, 46),
('44', 'Andrea Ligia Campos Huanca', 'B1', 'S2', '24-3', NULL, false, 47),
('45', 'Andreina Nashely Castro Tejada', 'B1', NULL, '26-3', NULL, false, 48),
('46', 'Beatriz Almaraz León', 'B1', NULL, '26-3', NULL, false, 49),
('47', 'Brian Rodrigo Pizarro Saca', 'B1', NULL, '26-3', NULL, false, 50),
('48', 'Camila Belén Campaña Medrano', 'B1', 'S1', '24-3', NULL, false, 51),
('49', 'Camila Jhuliane Arzadun Saavedra', 'B1', NULL, '26-3', NULL, false, 52),
('50', 'Consuelo Jimena Valenzuela Ramos', 'B1', NULL, '26-3', NULL, false, 53),
('51', 'Daira Aylen Césaro Peñarrieta', 'B1', NULL, '26-3', NULL, false, 54),
('52', 'Damaris Celina Sossa Garcia', 'B1', NULL, '26-3', NULL, false, 55),
('53', 'Daniela Eliana Zabala Quispe', 'B1', NULL, '26-3', NULL, false, 56),
('54', 'Elia Belen Mendoza Chura', 'B1', NULL, '26-3', NULL, false, 57),
('55', 'Francia Katerine Pacheco Vargas', 'B1', NULL, '26-3', NULL, false, 58),
('56', 'Giacomo Montaño Ulunque', 'B1', NULL, '26-3', NULL, false, 59),
('57', 'Heidi Rojas Franco', 'B1', NULL, '26-3', NULL, false, 60),
('58', 'Isabel Johana Aramayo Arispe', 'B1', NULL, '26-3', NULL, false, 61),
('59', 'Janeth Condori Mamani', 'B1', 'S2', '25-3', NULL, false, 62),
('60', 'Jazmín Carla Valencia León', 'B1', NULL, '26-3', NULL, false, 63),
('61', 'José Sander Torrico Andrade', 'B1', NULL, '26-3', NULL, false, 64),
('62', 'Josue Alexander Andrade Rojas', 'B1', NULL, '26-3', NULL, false, 65),
('63', 'Karen Mamani Porco', 'B1', NULL, '26-3', NULL, false, 66),
('64', 'Keyla Ojeda Benito', 'B1', 'Mz', '23-3', NULL, false, 67),
('65', 'Kevin Quinteros Porco', 'B1', NULL, '26-3', NULL, false, 68),
('66', 'Liz Daniela Torrico Ortega', 'B1', NULL, '26-3', NULL, false, 69),
('67', 'Lizeth Francinet Bautista Rod.', 'B1', 'Ca', '24-3', 'Lunes', false, 70),
('68', 'Maria Andrea Pelaez Cruz', 'B1', 'Mz', '25-3', NULL, false, 71),
('69', 'Maria Cristina Quispe Alejandro', 'B1', NULL, '26-3', NULL, false, 72),
('70', 'Maria Eugenia Rojas Quinteros', 'B1', NULL, '26-3', NULL, false, 73),
('71', 'Maribel Rojas Calicho', 'B1', NULL, '26-3', NULL, false, 74),
('72', 'Marycielo Adriana García Aguilera', 'B1', 'S2', '23-3', NULL, false, 75),
('73', 'Mauricio Pablo Rodriguez Morochi', 'B1', NULL, '26-3', NULL, false, 76),
('74', 'Mia Melody Alarcon Sandoval', 'B1', NULL, '26-3', NULL, false, 77),
('75', 'Nataly Aguilar Nery', 'B1', NULL, '26-3', NULL, false, 78),
('76', 'Nataly Katerine Terrazas Gomez', 'B1', 'Ca', '25-3', NULL, false, 79),
('77', 'Nicole Marisol Flores Choquetopa', 'B1', NULL, '26-3', NULL, false, 80),
('78', 'Paola Pebles Campos Huanca', 'B1', NULL, '26-3', NULL, false, 81),
('79', 'Raquel Semo Quispe', 'B1', NULL, '26-3', NULL, false, 82),
('80', 'Rocio Aguilar Nina', 'B1', NULL, '26-3', NULL, false, 83),
('81', 'Romina Liliana Beltran Loza', 'B1', NULL, '26-3', NULL, false, 84),
('82', 'Rubí Esther Borrell Arévalo', 'B1', NULL, '26-3', NULL, false, 85),
('83', 'Ruth Matilde Caba Villarroel', 'B1', 'S1', '25-3', NULL, false, 86),
('84', 'Ryciel Tangara Villafuerte', 'B1', NULL, '26-3', NULL, false, 87),
('85', 'Santiago Leonardo Lora Quilla', 'B1', NULL, '26-3', NULL, false, 88),
('86', 'Sara Camila Jauregui Huaylla', 'B1', 'S1', '25-3', NULL, false, 89),
('87', 'Sebastian Joel Herrera Miranda', 'B1', NULL, '26-3', NULL, false, 90),
('88', 'Sonia Coca Sarabia', 'B1', NULL, '26-3', NULL, false, 91),
('89', 'Stefani Stehli Bustillo', 'B1', NULL, '26-3', NULL, false, 92),
('90', 'Valentina Shirley Flores Acosta', 'B1', 'Ca', '22-7', 'R.I.', false, 93),
('91', 'Ada Noemí Reyes Andrade', 'B2', 'Ca', '22-7', NULL, false, 94),
('92', 'Alex Martín Murillo Chávez', 'B2', NULL, '26-3', NULL, false, 95),
('93', 'Aline Gabriela Perez Oroza', 'B2', NULL, '26-3', NULL, false, 96),
('94', 'Beatriz del Carmen Patiño Alvis', 'B2', 'S2', '24-3', NULL, false, 97),
('95', 'Benita Oña Serapio Vda. de Alcoba', 'B2', NULL, '26-3', NULL, false, 98),
('96', 'Carlos Quisbert Sandoval', 'B2', NULL, '26-3', NULL, false, 99),
('97', 'Carmen Nedielka Kuscevic Lobo', 'B2', 'Ca', '25-3', NULL, false, 100),
('98', 'Carmen Sylvia Rocabado Barrientos', 'B2', 'Mz', '22-7', NULL, false, 101),
('99', 'Cinthia Cabero Hinojosa', 'B2', 'S2', '25-3', NULL, false, 102),
('100', 'Edgar Giovanni Pinto Peredo', 'B2', NULL, '26-3', NULL, false, 103),
('101', 'Edith Adelina Orihuela Puita', 'B2', 'S1', '25-3', NULL, false, 104),
('102', 'Erika Gabriela Hinojosa Ricaldi', 'B2', NULL, '26-3', NULL, false, 105),
('103', 'Erika Noemi Pacheco Rodríguez', 'B2', NULL, '26-3', NULL, false, 106),
('104', 'Evelyn Carla Orellana Leytón', 'B2', NULL, '26-3', NULL, false, 107),
('105', 'Felix Marcelo Villarroel Donaire', 'B2', NULL, '26-3', NULL, false, 108),
('106', 'Helen Lisbeth Medina Aguirre', 'B2', 'S2', '23-3', NULL, false, 109),
('107', 'Isabel Canelas Schütt', 'B2', NULL, '26-3', NULL, false, 110),
('108', 'Janette Rhina Ortiz Zurita', 'B2', NULL, '26-3', NULL, false, 111),
('109', 'Juana Cruz Campos', 'B2', 'Ca', '25-3', NULL, false, 112),
('110', 'Juana Nancy Eulate Soliz', 'B2', NULL, '26-3', NULL, false, 113),
('111', 'Julia Marizol Mantilla Ergueta', 'B2', NULL, '26-3', NULL, false, 114),
('112', 'Katherine Olivia Jimenez Ruiz', 'B2', NULL, '26-3', NULL, false, 115),
('113', 'Lenny Ríos Medrano', 'B2', NULL, '26-3', NULL, false, 116),
('114', 'Ligia Nataly Bustillo Lafuente', 'B2', NULL, '26-3', NULL, false, 117),
('115', 'Margarita Ribert Herbas', 'B2', 'Mz', '24-3', NULL, false, 118),
('116', 'María del Carmen Calderón Sanjines', 'B2', NULL, '26-3', NULL, false, 119),
('117', 'Maria Lina Caballero Zenteno', 'B2', NULL, '26-3', NULL, false, 120),
('118', 'María Luisa Zurita Coca', 'B2', NULL, '26-3', NULL, false, 121),
('119', 'Maria Teresa Benavides Gisbert', 'B2', 'Mz', '24-3', NULL, false, 122),
('120', 'María Teresa Prado Suárez', 'B2', NULL, '26-3', NULL, false, 123),
('121', 'Marvin Orlando Castro Carretero', 'B2', NULL, '26-3', NULL, false, 124),
('122', 'Mary Morales Morales', 'B2', NULL, '26-3', NULL, false, 125),
('123', 'Mireya Azul Crespo Moruno', 'B2', 'Ca', '23-3', 'R.I.', false, 126),
('124', 'Nelly Jaldin Honor', 'B2', NULL, '26-3', NULL, false, 127),
('125', 'Ninoska Evelin Blanco Padilla', 'B2', 'Ca', '24-3', NULL, false, 128),
('126', 'Praxides Cusipuma Puita', 'B2', NULL, '26-3', NULL, false, 129),
('127', 'Rilca Scarlet Tapia Vilaseca', 'B2', 'Mz', '22-7', NULL, false, 130),
('128', 'Rosa Vargas Condori', 'B2', NULL, '26-3', NULL, false, 131),
('129', 'Ruth Mery Lopez Cruz', 'B2', 'Ca', '25-3', NULL, false, 132),
('130', 'Sandra Sharon Valda Maldonado', 'B2', NULL, '26-3', NULL, false, 133),
('131', 'Sonia Carmen Castro Herredia', 'B2', NULL, '26-3', NULL, false, 134),
('132', 'Sonia Quinteros Arratia', 'B2', 'Mz', '23-6', NULL, false, 135),
('133', 'Volga Cecilia Urquieta Valdivia', 'B2', NULL, '26-3', NULL, false, 136),
('134', 'Wilhelm Pavel Cordova Rivera', 'B2', NULL, '26-3', NULL, false, 137);
