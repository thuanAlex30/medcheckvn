// Seed script — import ~30 thuốc phổ biến VN để dev/test.
// Chạy: npm run seed
import '../modules/drugs/drug.model';
import '../modules/interactions/interaction.model';
import '../modules/prices/price.model';
import { DrugModel } from '../modules/drugs/drug.model';
import { InteractionModel } from '../modules/interactions/interaction.model';
import { PriceModel } from '../modules/prices/price.model';
import { viNormalize, viSlug } from '../shared/utils/vietnamese-slug';
import { connectMongo, disconnectMongo } from '../shared/config/db';

interface SeedDrug {
  brandNameVi: string;
  brandNameEn?: string;
  registrationNumber?: string;
  imageUrl?: string;
  activeIngredients: Array<{ name: string; rxCUI: string; strength: string }>;
  form: 'viên nén' | 'viên nang' | 'siro' | 'tiêm' | 'bôi ngoài da' | 'nhỏ mắt' | 'khác';
  manufacturer?: string;
  prescriptionRequired: boolean;
  usageVi?: string;
  dosageVi?: string;
  contraindicationsVi?: string[];
  sideEffectsVi?: Array<{ description: string; frequency: 'thường gặp' | 'ít gặp' | 'hiếm gặp' }>;
  warningsForConditions?: Array<{ condition: string; warningVi: string; severity: 'nặng' | 'trung bình' | 'nhẹ' }>;
  confidenceLevel: 'xanh' | 'vang' | 'xam';
  verifiedByPharmacist: boolean;
  sourceRefs?: Array<{ source: string; url?: string }>;
}

const SEED_DRUGS: SeedDrug[] = [
  {
    brandNameVi: 'Paracetamol 500mg',
    brandNameEn: 'Acetaminophen 500mg',
    registrationNumber: 'VD-12345-12',
    imageUrl: 'https://placehold.co/256x256/png?text=Paracetamol',
    activeIngredients: [{ name: 'Paracetamol', rxCUI: '161', strength: '500mg' }],
    form: 'viên nén',
    manufacturer: 'Imexpharm',
    prescriptionRequired: false,
    usageVi: 'Hạ sốt, giảm đau nhẹ và vừa',
    dosageVi: 'Người lớn: 1-2 viên mỗi 4-6 giờ, tối đa 8 viên/ngày',
    contraindicationsVi: ['Quá mẫn cảm với paracetamol', 'Suy gan nặng'],
    sideEffectsVi: [
      { description: 'Buồn nôn, đau bụng', frequency: 'ít gặp' },
      { description: 'Phản ứng dị ứng da', frequency: 'hiếm gặp' },
    ],
    warningsForConditions: [
      { condition: 'suy gan', warningVi: 'Paracetamol chuyển hóa qua gan — cần giảm liều', severity: 'nặng' },
      { condition: 'nghiện rượu', warningVi: 'Tăng nguy cơ độc gan', severity: 'trung bình' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
    sourceRefs: [{ source: 'OpenFDA', url: 'https://openfda.gov' }, { source: 'DAV.gov.vn' }],
  },
  {
    brandNameVi: 'Panadol Extra 500mg',
    brandNameEn: 'Panadol Extra',
    registrationNumber: 'VD-21032-15',
    imageUrl: 'https://placehold.co/256x256/png?text=Panadol',
    activeIngredients: [{ name: 'Paracetamol', rxCUI: '161', strength: '500mg' }],
    form: 'viên nén',
    manufacturer: 'GlaxoSmithKline',
    prescriptionRequired: false,
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Efferalgan 500mg',
    brandNameEn: 'Efferalgan',
    activeIngredients: [{ name: 'Paracetamol', rxCUI: '161', strength: '500mg' }],
    form: 'viên nén',
    manufacturer: 'Upsa',
    prescriptionRequired: false,
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Amoxilin 500mg',
    brandNameEn: 'Amoxicillin 500mg',
    registrationNumber: 'VD-17892-13',
    activeIngredients: [{ name: 'Amoxicillin', rxCUI: '723', strength: '500mg' }],
    form: 'viên nang',
    manufacturer: 'Stada',
    prescriptionRequired: true,
    usageVi: 'Kháng sinh điều trị nhiễm khuẩn',
    dosageVi: '250-500mg mỗi 8 giờ tùy chỉ định',
    contraindicationsVi: ['Dị ứng penicillin'],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Augmentin 625mg',
    brandNameEn: 'Augmentin 625mg',
    activeIngredients: [
      { name: 'Amoxicillin', rxCUI: '723', strength: '500mg' },
      { name: 'Clavulanic acid', rxCUI: '60889', strength: '125mg' },
    ],
    form: 'viên nén',
    manufacturer: 'GlaxoSmithKline',
    prescriptionRequired: true,
    usageVi: 'Kháng sinh phổ rộng, ổn định hơn với clavulanic acid',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Omeprazole 20mg',
    brandNameEn: 'Omeprazole 20mg',
    activeIngredients: [{ name: 'Omeprazole', rxCUI: '7646', strength: '20mg' }],
    form: 'viên nang',
    manufacturer: 'AstraZeneca',
    prescriptionRequired: true,
    usageVi: 'Ức chế bơm proton — điều trị loét dạ dày, GERD',
    dosageVi: '20mg x 1-2 lần/ngày',
    warningsForConditions: [
      { condition: 'suy gan', warningVi: 'Omeprazole chuyển hóa qua gan — cần giảm liều', severity: 'trung bình' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Losartan 50mg',
    brandNameEn: 'Losartan 50mg',
    activeIngredients: [{ name: 'Losartan', rxCUI: '52175', strength: '50mg' }],
    form: 'viên nén',
    manufacturer: 'Merck',
    prescriptionRequired: true,
    usageVi: 'Thuốc hạ huyết áp, ức chế thụ thể angiotensin II',
    dosageVi: '25-50mg x 1 lần/ngày',
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'Theo dõi chức năng thận khi dùng Losartan', severity: 'trung bình' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Metformin 500mg',
    brandNameEn: 'Metformin 500mg',
    activeIngredients: [{ name: 'Metformin', rxCUI: '6809', strength: '500mg' }],
    form: 'viên nén',
    manufacturer: 'Merck',
    prescriptionRequired: true,
    usageVi: 'Điều trị đái tháo đường type 2',
    dosageVi: '500mg x 2-3 lần/ngày',
    contraindicationsVi: ['Suy thận nặng', 'Nhiễm acid lactic'],
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'Metformin thải trừ qua thận — chống chỉ định khi eGFR < 30', severity: 'nặng' },
      { condition: 'suy gan', warningVi: 'Tăng nguy cơ nhiễm acid lactic', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Aspirin 81mg',
    brandNameEn: 'Aspirin 81mg',
    activeIngredients: [{ name: 'Aspirin', rxCUI: '1191', strength: '81mg' }],
    form: 'viên nén',
    manufacturer: 'Bayer',
    prescriptionRequired: false,
    usageVi: 'Kháng kết tập tiểu cầu, phòng ngừa bệnh tim mạch ở liều thấp',
    warningsForConditions: [
      { condition: 'loét dạ dày', warningVi: 'Aspirin có thể gây xuất huyết tiêu hóa', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Atorvastatin 20mg',
    brandNameEn: 'Atorvastatin 20mg',
    activeIngredients: [{ name: 'Atorvastatin', rxCUI: '83367', strength: '20mg' }],
    form: 'viên nén',
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    usageVi: 'Hạ cholesterol, phòng bệnh tim mạch',
    dosageVi: '10-20mg x 1 lần/ngày',
    contraindicationsVi: ['Bệnh gan đang hoạt động'],
    warningsForConditions: [
      { condition: 'suy gan', warningVi: 'Atorvastatin chuyển hóa qua gan — theo dõi men gan', severity: 'trung bình' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Ibuprofen 400mg',
    brandNameEn: 'Ibuprofen 400mg',
    activeIngredients: [{ name: 'Ibuprofen', rxCUI: '5640', strength: '400mg' }],
    form: 'viên nén',
    manufacturer: 'Pfizer',
    prescriptionRequired: false,
    usageVi: 'Giảm đau, hạ sốt, kháng viêm',
    dosageVi: '200-400mg mỗi 4-6 giờ, tối đa 1200mg/ngày (OTC)',
    contraindicationsVi: ['Loét dạ dày tá tràng', 'Suy thận nặng'],
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'NSAID có thể làm giảm chức năng thận', severity: 'trung bình' },
      { condition: 'loét dạ dày', warningVi: 'NSAID tăng nguy cơ xuất huyết tiêu hóa', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Vitamin C 500mg',
    brandNameEn: 'Ascorbic acid 500mg',
    activeIngredients: [{ name: 'Vitamin C', rxCUI: '2023', strength: '500mg' }],
    form: 'viên nén',
    manufacturer: 'Dược Hậu Giang',
    prescriptionRequired: false,
    usageVi: 'Bổ sung vitamin C, tăng cường miễn dịch',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: false,
  },
  {
    brandNameVi: 'Biotin 10mg',
    brandNameEn: 'Biotin 10mg',
    activeIngredients: [{ name: 'Biotin', rxCUI: '6108', strength: '10mg' }],
    form: 'viên nén',
    manufacturer: 'Dược Hậu Giang',
    prescriptionRequired: false,
    usageVi: 'Bổ sung biotin cho tóc, da, móng',
    confidenceLevel: 'vang',
    verifiedByPharmacist: false,
  },
  {
    brandNameVi: 'Dexamethasone 0.5mg',
    brandNameEn: 'Dexamethasone 0.5mg',
    activeIngredients: [{ name: 'Dexamethasone', rxCUI: '2538', strength: '0.5mg' }],
    form: 'viên nén',
    manufacturer: 'DKSH',
    prescriptionRequired: true,
    usageVi: 'Corticosteroid — kháng viêm, ức chế miễn dịch',
    dosageVi: '0.5-10mg/ngày tùy bệnh',
    warningsForConditions: [
      { condition: 'tiểu đường', warningVi: 'Corticosteroid làm tăng glucose máu', severity: 'nặng' },
      { condition: 'loãng xương', warningVi: 'Dùng dài ngày có thể làm nặng thêm loãng xương', severity: 'trung bình' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Cetirizine 10mg',
    brandNameEn: 'Cetirizine 10mg',
    activeIngredients: [{ name: 'Cetirizine', rxCUI: '2012', strength: '10mg' }],
    form: 'viên nén',
    manufacturer: 'Stada',
    prescriptionRequired: false,
    usageVi: 'Kháng histamin H1 — trị dị ứng, ngứa, viêm mũi dị ứng',
    dosageVi: '10mg x 1 lần/ngày',
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'Cetirizine thải trừ qua thận — giảm liều', severity: 'nhẹ' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Loratadine 10mg',
    brandNameEn: 'Loratadine 10mg',
    activeIngredients: [{ name: 'Loratadine', rxCUI: '3886', strength: '10mg' }],
    form: 'viên nén',
    manufacturer: 'Bayer',
    prescriptionRequired: false,
    usageVi: 'Kháng histamin không gây buồn ngủ',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Domperidone 10mg',
    brandNameEn: 'Domperidone 10mg',
    activeIngredients: [{ name: 'Domperidone', rxCUI: '3538', strength: '10mg' }],
    form: 'viên nén',
    manufacturer: 'Janssen',
    prescriptionRequired: true,
    usageVi: 'Chống nôn, tăng nhu động dạ dày',
    dosageVi: '10-20mg x 3-4 lần/ngày',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Tryptan 50mg',
    brandNameEn: 'Sertraline 50mg',
    activeIngredients: [{ name: 'Sertraline', rxCUI: '9383', strength: '50mg' }],
    form: 'viên nén',
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    usageVi: 'Chống trầm cảm, rối loạn lo âu (SSRI)',
    dosageVi: '50mg x 1 lần/ngày, có thể tăng sau 1 tuần',
    warningsForConditions: [
      { condition: 'trầm cảm', warningVi: 'Theo dõi ý nghĩ tự sát trong 2 tuần đầu dùng SSRI', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Gabapentin 300mg',
    brandNameEn: 'Gabapentin 300mg',
    activeIngredients: [{ name: 'Gabapentin', rxCUI: '25480', strength: '300mg' }],
    form: 'viên nang',
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    usageVi: 'Điều trị đau thần kinh, động kinh',
    dosageVi: '300mg x 3 lần/ngày, có thể tăng dần',
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'Gabapentin thải trừ qua thận — cần giảm liều', severity: 'trung bình' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Enalapril 10mg',
    brandNameEn: 'Enalapril 10mg',
    activeIngredients: [{ name: 'Enalapril', rxCUI: '3827', strength: '10mg' }],
    form: 'viên nén',
    manufacturer: 'Merck',
    prescriptionRequired: true,
    usageVi: 'Ức chế men chuyển (ACEI) — hạ huyết áp',
    dosageVi: '5-20mg x 1-2 lần/ngày',
    contraindicationsVi: ['Thai kỳ', 'Quá mẫn với ACEI'],
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'ACEI có thể làm giảm chức năng thận — theo dõi creatinine', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Furosemid 40mg',
    brandNameEn: 'Furosemide 40mg',
    activeIngredients: [{ name: 'Furosemide', rxCUI: '4603', strength: '40mg' }],
    form: 'viên nén',
    manufacturer: 'DKSH',
    prescriptionRequired: true,
    usageVi: 'Thuốc lợi tiểu — điều trị phù, suy tim',
    dosageVi: '20-80mg/ngày tùy tình trạng',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Spironolactone 25mg',
    brandNameEn: 'Spironolactone 25mg',
    activeIngredients: [{ name: 'Spironolactone', rxCUI: '9997', strength: '25mg' }],
    form: 'viên nén',
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    usageVi: 'Thuốc lợi tiểu giữ kali — điều trị suy tim, xơ gan',
    dosageVi: '25-100mg/ngày',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Amlodipine 5mg',
    brandNameEn: 'Amlodipine 5mg',
    activeIngredients: [{ name: 'Amlodipine', rxCUI: '17767', strength: '5mg' }],
    form: 'viên nén',
    manufacturer: 'Pfizer',
    prescriptionRequired: true,
    usageVi: 'Chẹn kênh calci — hạ huyết áp, đau thắt ngực',
    dosageVi: '5mg x 1 lần/ngày, có thể tăng lên 10mg',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Diltiazem 60mg',
    brandNameEn: 'Diltiazem 60mg',
    activeIngredients: [{ name: 'Diltiazem', rxCUI: '3443', strength: '60mg' }],
    form: 'viên nén',
    manufacturer: 'Sandoz',
    prescriptionRequired: true,
    usageVi: 'Chẹn kênh calci — hạ huyết áp, kiểm soát nhịp tim',
    dosageVi: '60-120mg x 3 lần/ngày',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Digoxin 0.25mg',
    brandNameEn: 'Digoxin 0.25mg',
    activeIngredients: [{ name: 'Digoxin', rxCUI: '3407', strength: '0.25mg' }],
    form: 'viên nén',
    manufacturer: 'DKSH',
    prescriptionRequired: true,
    usageVi: 'Glycoside tim — điều trị suy tim, rung nhĩ',
    dosageVi: '0.125-0.25mg/ngày, cần theo dõi nồng độ',
    contraindicationsVi: ['Block tim độ 2-3'],
    warningsForConditions: [
      { condition: 'suy thận', warningVi: 'Digoxin thải trừ qua thận — nguy cơ ngộ độc', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Clopidogrel 75mg',
    brandNameEn: 'Clopidogrel 75mg',
    activeIngredients: [{ name: 'Clopidogrel', rxCUI: '32948', strength: '75mg' }],
    form: 'viên nén',
    manufacturer: 'Sanofi',
    prescriptionRequired: true,
    usageVi: 'Kháng kết tập tiểu cầu — phòng ngừa huyết khối sau stent, đột quỵ',
    dosageVi: '75mg x 1 lần/ngày',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Warfarin 5mg',
    brandNameEn: 'Warfarin 5mg',
    activeIngredients: [{ name: 'Warfarin', rxCUI: '11289', strength: '5mg' }],
    form: 'viên nén',
    manufacturer: 'Bristol-Myers',
    prescriptionRequired: true,
    usageVi: 'Thuốc chống đông — điều trị rung nhĩ, huyết khối tĩnh mạch',
    dosageVi: '2-10mg/ngày, điều chỉnh theo INR',
    contraindicationsVi: ['Thai kỳ', 'Xuất huyết tiêu hóa đang hoạt động'],
    warningsForConditions: [
      { condition: 'suy gan', warningVi: 'Warfarin chuyển hóa qua gan, thận trọng trong suy gan nặng', severity: 'nặng' },
    ],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Loperamide 2mg',
    brandNameEn: 'Loperamide 2mg',
    activeIngredients: [{ name: 'Loperamide', rxCUI: '6250', strength: '2mg' }],
    form: 'viên nén',
    manufacturer: 'Johnson & Johnson',
    prescriptionRequired: false,
    usageVi: 'Chống tiêu chảy cấp',
    dosageVi: '2 viên lần đầu, sau đó 1 viên sau mỗi lần đi phân lỏng, tối đa 8 viên/ngày',
    contraindicationsVi: ['Viêm đại tràng loét', 'Tiêu chảy do kháng sinh nặng'],
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'Smecta 3g',
    brandNameEn: 'Smecta 3g',
    activeIngredients: [{ name: 'Diosmectite', rxCUI: '214993', strength: '3g' }],
    form: 'khác',
    manufacturer: 'Ipsen',
    prescriptionRequired: false,
    usageVi: 'Thuốc bột điều trị tiêu chảy cấp và mạn tính ở trẻ em và người lớn',
    dosageVi: '3g (1 gói) x 2-3 lần/ngày',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: true,
  },
  {
    brandNameVi: 'ORS Gại An 1.39g',
    brandNameEn: 'ORS',
    activeIngredients: [{ name: 'ORS', rxCUI: '2829', strength: '1.39g' }],
    form: 'khác',
    manufacturer: 'Dược Nam Hà',
    prescriptionRequired: false,
    usageVi: 'Bù nước và điện giải trong tiêu chảy',
    dosageVi: 'Hòa 1 gói với 200ml nước, uống nhiều lần',
    confidenceLevel: 'xanh',
    verifiedByPharmacist: false,
  },
];

interface SeedInteraction {
  ingredientARxCUI: string;
  ingredientBRxCUI: string;
  severity: 'nặng' | 'trung bình' | 'nhẹ';
  descriptionVi: string;
  mechanismVi?: string;
  recommendationVi?: string;
}

const SEED_INTERACTIONS: SeedInteraction[] = [
  {
    ingredientARxCUI: '161',
    ingredientBRxCUI: '4603',
    severity: 'nhẹ',
    descriptionVi: 'Paracetamol có thể làm giảm tác dụng lợi tiểu của Furosemide khi dùng chung',
    recommendationVi: 'Theo dõi hiệu quả lợi tiểu, có thể cần điều chỉnh liều Furosemide',
  },
  {
    ingredientARxCUI: '32948',
    ingredientBRxCUI: '1191',
    severity: 'nặng',
    descriptionVi: 'Dùng đồng thời Clopidogrel và Aspirin làm tăng nguy cơ chảy máu đáng kể',
    mechanismVi: 'Cả hai đều ức chế chức năng tiểu cầu qua cơ chế khác nhau, tác dụng cộng hưởng',
    recommendationVi: 'Chỉ dùng đồng thời khi có chỉ định rõ ràng của bác sĩ (ví dụ: sau đặt stent)',
  },
  {
    ingredientARxCUI: '11289',
    ingredientBRxCUI: '161',
    severity: 'trung bình',
    descriptionVi: 'Paracetamol liều cao (> 2g/ngày) kéo dài có thể tăng tác dụng chống đông của Warfarin',
    mechanismVi: 'Paracetamol ức chế chuyển hóa Warfarin qua CYP450',
    recommendationVi: 'Nếu dùng Paracetamol > 2g/ngày trên 3 ngày, theo dõi INR thường xuyên hơn',
  },
  {
    ingredientARxCUI: '11289',
    ingredientBRxCUI: '5640',
    severity: 'nặng',
    descriptionVi: 'Ibuprofen làm tăng nguy cơ chảy máu dạ dày và tăng tác dụng chống đông của Warfarin',
    mechanismVi: 'NSAID ức chế COX, giảm tổng hợp prostacyclin bảo vệ niêm mạc dạ dày, đồng thời tăng nguy cơ xuất huyết',
    recommendationVi: 'Tránh dùng đồng thời. Ưu tiên dùng Paracetamol thay thế nếu cần giảm đau',
  },
  {
    ingredientARxCUI: '11289',
    ingredientBRxCUI: '1191',
    severity: 'nặng',
    descriptionVi: 'Dùng đồng thời Warfarin và Aspirin làm tăng rất cao nguy cơ chảy máu, đặc biệt xuất huyết tiêu hóa',
    mechanismVi: 'Warfarin giảm yếu tố đông máu, Aspirin ức chế kết tập tiểu cầu — nguy cơ cộng hưởng cao',
    recommendationVi: 'Chỉ dùng đồng thời khi có chỉ định đặc biệt của bác sĩ, cần theo dõi INR và biểu hiện chảy máu sớm',
  },
  {
    ingredientARxCUI: '11289',
    ingredientBRxCUI: '32948',
    severity: 'nặng',
    descriptionVi: 'Phối hợp Warfarin + Clopidogrel làm tăng nguy cơ xuất huyết nghiêm trọng',
    recommendationVi: 'Chỉ khi lợi ích vượt rủi ro rõ ràng. Theo dõi sát INR và dấu hiệu chảy máu',
  },
  {
    ingredientARxCUI: '6809',
    ingredientBRxCUI: '4603',
    severity: 'trung bình',
    descriptionVi: 'Furosemide có thể ảnh hưởng đến kiểm soát đường huyết và tăng nguy cơ nhiễm acid lactic nếu dùng chung',
    mechanismVi: 'Furosemide gây mất nước và rối loạn điện giải, có thể làm tăng nguy cơ lactic acidosis',
    recommendationVi: 'Theo dõi chức năng thận và glucose máu thường xuyên khi phối hợp',
  },
  {
    ingredientARxCUI: '7646',
    ingredientBRxCUI: '11289',
    severity: 'nặng',
    descriptionVi: 'Omeprazole ức chế CYP2C19, làm tăng nồng độ Warfarin đáng kể — nguy cơ chảy máu cao',
    mechanismVi: 'Omeprazole giảm chuyển hóa Warfarin qua CYP2C19',
    recommendationVi: 'Nếu cần PPI, ưu tiên Pantoprazole ít tương tác hơn. Theo dõi INR chặt chẽ nếu dùng đồng thời',
  },
  {
    ingredientARxCUI: '52175',
    ingredientBRxCUI: '4603',
    severity: 'nhẹ',
    descriptionVi: 'Dùng đồng thời Losartan và Furosemide có thể gây hạ huyết áp quá mức, đặc biệt ở người già',
    mechanismVi: 'Cả hai đều có tác dụng hạ huyết áp, cộng hưởng khi bắt đầu dùng',
    recommendationVi: 'Bắt đầu ở liều thấp, theo dõi huyết áp sau 1-2 tuần đầu',
  },
  {
    ingredientARxCUI: '83367',
    ingredientBRxCUI: '17767',
    severity: 'trung bình',
    descriptionVi: 'Amlodipine làm tăng nồng độ Atorvastatin, tăng nguy cơ bệnh cơ (myopathy)',
    mechanismVi: 'Amlodipine ức chế CYP3A4, giảm chuyển hóa Atorvastatin',
    recommendationVi: 'Giới hạn Atorvastatin ở liều 20mg/ngày khi dùng đồng thời với Amlodipine',
  },
  {
    ingredientARxCUI: '17767',
    ingredientBRxCUI: '52175',
    severity: 'trung bình',
    descriptionVi: 'Phối hợp Amlodipine + Losartan là thường gặp trong điều trị tăng huyết áp, có thể gây hạ huyết áp quá mức',
    recommendationVi: 'Kết hợp này thường được dùng khi một thuốc đơn lẻ không kiểm soát được huyết áp',
  },
];

async function seed() {
  await connectMongo();
  console.log(`Seeding ${SEED_DRUGS.length} drugs...`);

  for (const drug of SEED_DRUGS) {
    const slug = viSlug(drug.brandNameVi);
    const searchNormalized = viNormalize(drug.brandNameVi);
    await DrugModel.findOneAndUpdate(
      { slug },
      { ...drug, slug, searchNormalized },
      { upsert: true, new: true },
    );
  }
  console.log(`  ✓ ${SEED_DRUGS.length} drugs`);

  console.log(`Seeding ${SEED_INTERACTIONS.length} interactions...`);
  for (const intr of SEED_INTERACTIONS) {
    await InteractionModel.findOneAndUpdate(
      { ingredientARxCUI: intr.ingredientARxCUI, ingredientBRxCUI: intr.ingredientBRxCUI },
      intr,
      { upsert: true },
    );
  }
  console.log(`  ✓ ${SEED_INTERACTIONS.length} interactions`);

  console.log('\nSeeding prices (deterministic stub)...');
  const drugs = await DrugModel.find({}, '_id brandNameVi').lean();
  const pharmacies = ['Long Châu', 'Pharmacity', 'An Khang'];
  const { createHash } = await import('node:crypto');
  let priceCount = 0;
  for (const drug of drugs) {
    for (const pharmacy of pharmacies) {
      // Deterministic giá từ hash id+pharmacy để test reproducible
      const hash = createHash('sha256').update(`${drug._id}-${pharmacy}`).digest();
      const cents = 20000 + (hash.readUInt32BE(0) % 180000);
      await PriceModel.findOneAndUpdate(
        { drugId: drug._id, pharmacySource: pharmacy },
        { drugId: drug._id, pharmacySource: pharmacy, price: cents, unit: 'hộp', scrapedAt: new Date() },
        { upsert: true },
      );
      priceCount++;
    }
  }
  console.log(`  ✓ ${priceCount} prices`);

  console.log('\n Seed complete!');
  await disconnectMongo();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
