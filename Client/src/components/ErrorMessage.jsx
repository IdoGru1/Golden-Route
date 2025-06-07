function ErrorMessage({ message }) {
  return message ? (
    <p style={{ color: 'red', margin: 0, fontSize: '13px' }}>{message}</p>
  ) : null;
}

export default ErrorMessage;
