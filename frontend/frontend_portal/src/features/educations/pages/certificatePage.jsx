import React, { useEffect, useRef, useState, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Loader from "../../../components/UI/loader/loader";
import EducationService from "../API/EducationService";
import { UserContext } from "../../../context";
import logo from "../../../img/Logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const CertificatePage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useContext(UserContext);
    const cardRef = useRef(null);

    const certificateNumberFromParams = params.certificateNumber;
    const certificateNumberFromState = location.state?.certificateNumber;
    const certificateNumber = certificateNumberFromParams || certificateNumberFromState || null;

    const [certificate, setCertificate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCertificate = async () => {
            if (!certificateNumber) return;
            setIsLoading(true);
            setError(null);
            try {
                const resp = await EducationService.getCertificateDetail(certificateNumber);
                setCertificate(resp.data);
            } catch (e) {
                setError(e?.message || 'Не удалось загрузить сертификат.');
            } finally {
                setIsLoading(false);
            }
        };

        loadCertificate();
    }, [certificateNumber]);

    const fullName = user
        ? `${user.last_name || ''} ${user.first_name || ''}`.trim() || user.username || ''
        : '';

    const backPath = location.state?.from || '/educations/my-courses';

    if (isLoading && !certificate && !error) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <button
                            type="button"
                            className="education-back-link"
                            onClick={() => navigate(backPath)}
                        >
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            Назад
                        </button>
                    </div>
                    <p className="education-block__error">
                        Ошибка: {String(error)}
                    </p>
                </div>
            </div>
        );
    }

    const courseTitle = certificate?.course_title || certificate?.course || '';
    const number = certificate?.number || certificateNumber || '';
    const issuedAt = certificate?.issued_at || certificate?.date || null;
    const formattedDate = issuedAt
        ? new Date(issuedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '';

    const handleDownloadPdf = async () => {
        if (!cardRef.current) return;
        const cardEl = cardRef.current;
        try {
            cardEl.classList.add('certificate-card--flat');

            const canvas = await html2canvas(cardEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });
            const imgData = canvas.toDataURL('image/png');

            const pxToMm = (px) => px * 0.264583; // 96dpi -> mm
            const pdfWidth = pxToMm(canvas.width);
            const pdfHeight = pxToMm(canvas.height);

            const orientation = pdfWidth >= pdfHeight ? 'landscape' : 'portrait';
            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
            const fileName = number || certificateNumber || 'certificate';
            pdf.save(`${fileName}.pdf`);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to generate certificate PDF', e);
        } finally {
            if (cardEl) {
                cardEl.classList.remove('certificate-card--flat');
            }
        }
    };

    return (
        <div className="page-wrapper section-page-wrapper">
            <div className="education-section-page">
                <div className="education-back-link-wrap certificate-page__controls">
                    <button
                        type="button"
                        className="education-back-link"
                        onClick={() => navigate(backPath)}
                    >
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        Назад к моим курсам
                    </button>
                    <button
                        type="button"
                        className="course-progress__continue-btn certificate-page__print-btn"
                        onClick={handleDownloadPdf}
                    >
                        Скачать PDF
                    </button>
                </div>

                <div className="certificate-page">
                    <div className="certificate-card" ref={cardRef}>
                        <div className="certificate-card__header">
                            <div className="certificate-card__logo-wrap">
                                <img src={logo} alt="Логотип" className="certificate-card__logo" />
                            </div>
                            <div className="certificate-card__brand">
                                <div className="certificate-card__site">Научный портал</div>
                                <div className="certificate-card__label">Сертификат об обучении</div>
                            </div>
                        </div>

                        <div className="certificate-card__body">
                            <div className="certificate-card__body-inner">
                                <p className="certificate-card__text">
                                    Настоящим подтверждается, что
                                </p>
                                <p className="certificate-card__name">
                                    {fullName || 'Фамилия Имя'}
                                </p>
                                <p className="certificate-card__text">
                                    успешно прошёл(а) курс
                                </p>
                                <p className="certificate-card__course">
                                    {courseTitle || 'Название курса'}
                                </p>
                            </div>
                        </div>

                        <div className="certificate-card__footer">
                            <div className="certificate-card__code-block">
                                <span className="certificate-card__code-label">Код сертификата</span>
                                <span className="certificate-card__code-value">{number || 'CERT-XXXX'}</span>
                            </div>
                            {formattedDate && (
                                <div className="certificate-card__date">
                                    Дата выдачи: {formattedDate}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificatePage;

