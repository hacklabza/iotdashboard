import moment from 'moment';


export const formatDateInterval = (date: Date) => {
  const rounded = Math.round(moment(date).minute() / 15) * 15;
  return moment(date).minute(rounded).second(0).format("HH:mm");
};
