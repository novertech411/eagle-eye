-- Which disease the examination screens for. Selects the ONNX model on the inference server.
-- Existing examinations were all screened for glaucoma, so they take the default.
create type screening_disease as enum ('glaucoma', 'diabetic_retinopathy');

alter table examinations
  add column disease screening_disease not null default 'glaucoma';
