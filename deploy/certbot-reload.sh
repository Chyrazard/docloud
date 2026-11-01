#!/bin/sh
case " $RENEWED_DOMAINS " in
 *" dogs.belctech.com "*) /usr/sbin/nginx -t && /usr/bin/systemctl reload nginx ;;
esac
